import { Upload } from "@aws-sdk/lib-storage";
import { FfprobeData } from "@ts-ffmpeg/fluent-ffmpeg";
import { parse } from "anitomy";
import axios from "axios";
import { randomUUID } from "crypto";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import { _QueryFilter } from "mongoose";
import os from "os";
import path from "path";
import {
  cloudConvert,
  CLOUDFARE_APP_BUCKET,
  CLOUDFARE_URL,
  cloudflareAccessKey,
  cloudflareClient,
  cloudflareSecretKey,
  downloadTasks,
  ffmpeg,
  malIdSubplMap,
  seedrCl,
  subsplease,
} from "../configs/config.js";
import { Episode } from "../models/showModel.js";
import { ThirdPartyMappings } from "../types/anizip.js";
import { Tasks } from "../types/show.js";
import {
  ParsedTorrentioStream,
  PikPakMediaLink,
  PikPakResponse,
  PikPakTaskResponse,
  TorrentioResponse,
} from "../types/torrentio.js";
import { createMagnetUri, getTorrentioApi } from "./shows.js";
import { stat } from "fs/promises";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL;

const pollForProg = async (
  fileId: string,
  taskId: string,
  pollUpdate: (prog: number) => void,
) => {
  let transfer: PikPakResponse | undefined;

  let prog = 0;
  let progInc = 21;

  console.log(fileId, taskId);

  while (!transfer || transfer.status !== "done") {
    const { data } = await axios.get<PikPakResponse>(
      `${PYTHON_SERVER_URL}/status`,
      {
        params: { file_id: fileId, task_id: taskId },
      },
    );
    pollUpdate(prog);
    transfer = data;

    if (prog + progInc < 99) prog += progInc;

    if (progInc > 1) progInc -= 5;
  }

  pollUpdate(100);

  return transfer;
};

const downloadTorrent = async (
  magnetUri: string,
  epInfo: Tasks["epInfo"],
  taskId: number,
  baseProg: number = 0,
  maxProg: number = 25,
) => {
  const { data } = await axios.post<PikPakTaskResponse>(
    `${PYTHON_SERVER_URL}/task`,
    { magUri: magnetUri },
  );

  console.log(data);

  let tr = await pollForProg(data.file_id, data.id, (prog) => {
    downloadTasks.set(taskId, {
      epInfo,
      progress: prog * ((maxProg - baseProg) / 100) + baseProg,
      status: "pending",
    });
  });

  return tr.info;
};

const downloadTorrentSeedr = async (
  magnetUri: string,
  epInfo: Tasks["epInfo"],
  taskId: number,
  baseProg: number = 0,
  maxProg: number = 25,
) => {
  const { user_torrent_id } = await seedrCl.tasks.addMagnet(magnetUri);
  const folder = await seedrCl.tasks.waitForTask(user_torrent_id!, {
    onProgress: (s) => {
      downloadTasks.set(taskId, {
        epInfo,
        progress: s.progress * ((maxProg - baseProg) / 100) + baseProg,
        status: "pending",
      });
    },
  });

  const contents = await seedrCl.folders.list(folder!.id);
  const link = await seedrCl.files.getDownloadUrl(
    contents.files[0]!.folder_file_id,
  );
  return {
    url: link.url,
    delFn: async () => {
      await seedrCl.files.delete(contents.files[0]!.folder_file_id);
    },
  };
};

const downloadToDisk = async (
  inputUrl: string,
  outputPath: string,
  onFinish: () => void,
  onError: () => void,
  prog: (e: any) => void,
) => {
  const response = await axios.get(inputUrl, {
    responseType: "stream",
    onDownloadProgress: prog,
  });

  await new Promise<void>((resolve, reject) => {
    const writer = createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on("finish", () => {
      console.log("Download finished successfully.");
      onFinish();
      resolve();
    });
    writer.on("error", (err) => {
      console.error("Write stream error during download:", err);
      onError();
      reject(err);
    });
  });
};

const compressWithCl = async (
  s3Key: string,
  input: string,
  prog: (val: number) => void,
  scale?: { width: number; height: number },
) => {
  prog(20)
  const job = await cloudConvert.jobs.create({
    tasks: {
      import: {
        operation: "import/upload",
      },
      "convert-op": {
        operation: "convert",
        input: "import",
        output_format: "mkv",
        input_format: "mkv",
        engine: "ffmpeg",
        video_codec: "x265",
        crf: 35,
        preset: "medium",
        audio_codec: "opus",
        audio_bitrate: 96,
        subtitles_mode: "copy",
        ...(scale?.height ? {height: scale.height} : {}),
        ...(scale?.width ? { width: scale.width } : {}),
      },
      export: {
        operation: "export/s3",
        access_key_id: cloudflareAccessKey,
        bucket: CLOUDFARE_APP_BUCKET,
        secret_access_key: cloudflareSecretKey,
        input: "convert-op",
        region: "auto",
        key: s3Key,
        endpoint: CLOUDFARE_URL,
      },
    },
  });

  const uploadTask = job.tasks.find((task) => task.name === "import");

  if (!uploadTask) {
    throw new Error("Task not found");
  }

  const inputFile = createReadStream(input);
  await cloudConvert.tasks.upload(uploadTask, inputFile);
  prog(45)
  const waitedJob = await cloudConvert.jobs.wait(job.id);

  if (waitedJob.status === "error") throw new Error("Job Failed");

  prog(90)
  const exportUrl = cloudConvert.jobs.getExportUrls(waitedJob)[0];

  prog(100)
  return exportUrl;
};

const compressWithFfmpeg = async (
  input: string,
  output: string,
  key: string,
  onError: () => void,
  prog: (val: number) => void,
  scale?: { width: number; height: number },
) => {
  // 1. Run Ffmpeg and output to local temp file
  await new Promise<void>((resolve, reject) => {
    const command = ffmpeg(input)
      .videoCodec("libx265") // Switched to high-efficiency HEVC
      .audioCodec("aac")
      .outputOptions("-crf 35")
      .outputOptions("-preset medium")
      .audioChannels(2)
      .audioBitrate("96k")
      .outputOptions("-pix_fmt yuv420p") // Forces standard 8-bit web color format
      .outputOptions("-tag:v hvc1") // Tells Apple/Chrome devices exactly how to decode the stream
      .outputOptions("-movflags +faststart")
      .format("matroska")
      .on("start", (command) => console.log("ffmpeg start", command))
      .on("error", (err) => {
        console.error("ffmpeg error", err);
        onError();
        reject(err);
      })
      .on("progress", ({ percent }) => {
        if (percent && percent >= 10) prog(percent - 10);
      })
      .on("end", () => {
        console.log("ffmpeg processing done");
        prog(90);
        resolve();
      });
    if (scale) command.size(`${scale.width}:${scale.height}`);
    command.save(output); // Saves directly to local storage safely
  });

  // 2. Upload the finished file to Cloudflare R2 using AWS Lib-Storage Upload
  console.log("Uploading file to Cloudflare R2...");
  const fileStream = createReadStream(output);

  const parallelUploads3 = new Upload({
    client: cloudflareClient,
    params: {
      Bucket: CLOUDFARE_APP_BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: "video/x-matroska",
    },
    // Optional configurations for tuning performance
    queueSize: 4,
    partSize: 1024 * 1024 * 5, // 5MB chunks
    leavePartsOnError: false,
  });

  await parallelUploads3.done();
};

const compressTorrent = async (
  vid: { url: string },
  taskId: number,
  epInfo: Tasks["epInfo"],
  shouldSave: boolean = true,
  fileName?: string,
  scale?: { width: number; height: number },
  baseProg: number = 25,
  maxProg: number = 100,
): Promise<void> => {
  console.log("compressTorrent", vid);

  const key = `videos/${fileName ?? randomUUID()}.mkv`;

  // Create a temporary local path to store the processed video
  const tempInpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);
  const tempOutpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);

  const { prog, onFinish, onError } = {
    prog: (e: any) => {
      if (e.total) {
        const frac = e.loaded / e.total; // 0..1
        downloadTasks.set(taskId, {
          epInfo,
          status: "pending",
          progress: frac * 10 * ((maxProg - baseProg) / 100) + baseProg,
        });
      }
    },
    onFinish: () =>
      downloadTasks.set(taskId, {
        epInfo,
        status: "pending",
        progress: 10 * ((maxProg - baseProg) / 100) + baseProg,
      }),
    onError: () =>
      downloadTasks.set(taskId, {
        epInfo,
        status: "error",
        progress: 10 * ((maxProg - baseProg) / 100) + baseProg,
      }),
  };

  // Download the input file to the temporary input path
  await downloadToDisk(vid.url, tempInpPath, onFinish, onError, prog);

  const compErr = () =>
    downloadTasks.set(taskId, {
      epInfo,
      status: "error",
      progress: downloadTasks.get(taskId)?.progress || 10,
    });

  const compProg = (percent: number) =>
    downloadTasks.set(taskId, {
      epInfo,
      status: "pending",
      progress: percent * ((maxProg - baseProg - 10) / 100) + baseProg + 10,
    });

  try {
    let isCompressed = false;
    try {
      await compressWithCl(key, tempInpPath, compProg, scale);
      isCompressed = true;
    } catch (err) {
      console.log(err);
    }

    if (!isCompressed) {
      await compressWithFfmpeg(
        tempInpPath,
        tempOutpPath,
        key,
        compErr,
        compProg, scale
      );
    }
    console.log("Upload completed successfully");

    downloadTasks.set(taskId, {
      epInfo,
      status: "pending",
      progress: 95 * ((maxProg - baseProg) / 100) + baseProg,
    });

    const uploadedFileUrl = `https://pub-991c552c64ed424ebd8971019038f0ad.r2.dev/${key}`;

    if (shouldSave) {
      // 3. Probe the file to get its duration, size, etc.
      const info = await cloudflareClient.send(
        new HeadObjectCommand({Bucket: CLOUDFARE_APP_BUCKET, Key: key})
      )

      await Episode.updateOne(
        {
          malId: epInfo.malId.toString(),
          eId: epInfo.episodeId,
          sId: epInfo.season,
          quality: epInfo.quality,
        } as _QueryFilter<any>,
        {
          isCompressed: true,
          fileUrl: uploadedFileUrl,
          manageInfo: {
            key: key,
            bucket: CLOUDFARE_APP_BUCKET,
          },
          fileSize: info.ContentLength,
        },
      );
    }

    downloadTasks.set(taskId, {
      epInfo,
      status: "completed",
      progress: 100 * ((maxProg - baseProg) / 100) + baseProg,
    });
  } catch (error) {
    console.error("Compression / Upload process failed:", error);
    downloadTasks.delete(taskId);
    throw error;
  } finally {
    // 4. Always clean up the local temp file to avoid running out of disk space
    try {
      await fs.unlink(tempInpPath);
      await fs.unlink(tempOutpPath);
      // await clnUpTorrent(vid.id);
      console.log("Cleaned up temp file:", tempInpPath, tempOutpPath);
    } catch (cleanupErr) {
      // Temp file might not have been created if it failed early
    }
  }
};

const dlAndCompress = async (
  taskId: number,
  epInfo: Tasks["epInfo"],
  magUri: string,
) => {
  let url: string | null = null;
  let cleanUp: (() => Promise<void>) | null = null;

  try {
    const sInfo = await downloadTorrentSeedr(magUri, epInfo, taskId);

    url = sInfo?.url;
    cleanUp = sInfo?.delFn;
  } catch (err) {
    console.log(err);
  }

  if (!url) {
    const vid = await downloadTorrent(magUri, epInfo, taskId);
    url = vid?.[0]?.url;
  }

  if (url && typeof url === "string") {
    await compressTorrent({ url }, taskId, epInfo);
    if (cleanUp) await cleanUp();
  } else {
    downloadTasks.set(taskId, { epInfo, progress: 0, status: "error" });
    throw new Error("Failed to download torrent");
  }
};

// const clnUpTorrent = async (id: string | number, maxRetries: number = 3) => {
//   for (let i = 0; i < maxRetries; i++) {
//     const contents = await seedr.deleteFile(id);

//     if (contents.result && contents.success) return contents;
//   }
// };

const QUALITY: Record<string, boolean> = {
  1080: false,
  720: false,
  480: false,
  360: false,
};

const ALLOWED = Object.entries(QUALITY).map((v) => v[0]);

const getAnimeTorrent = async (
  mappings: ThirdPartyMappings,
  sid: string,
  eId: string,
): Promise<{ filteredQuality: ParsedTorrentioStream[] }> => {
  const torrentioUrl = getTorrentioApi(
    `${mappings.imdb_id || mappings.themoviedb_id}:${sid}:${eId}`,
    "series",
  );

  const { data: torrRes } = await axios.get<TorrentioResponse>(torrentioUrl);

  const parsed: ParsedTorrentioStream[] = torrRes.streams.map((v) => ({
    info: v.name ? parse(v.name) : null,
    magUri:
      v.infoHash && v.sources ? createMagnetUri(v.infoHash, v.sources) : null,
    ...v,
  }));

  const filteredQuality: ParsedTorrentioStream[] = [];

  for (let info of parsed) {
    if (QUALITY[1080] && QUALITY[720] && QUALITY[360] && QUALITY[480]) break;

    let resolution = info.info?.video?.resolution
      ?.toLowerCase()
      ?.replace("p", "");

    if (resolution && ALLOWED.includes(resolution) && !QUALITY[resolution]) {
      filteredQuality.push(info);
      QUALITY[resolution] = true;
    }
  }

  return { filteredQuality };
};

const getSubplTorrent = async (
  malId: string | number,
  eid: string | number,
): Promise<null | ParsedTorrentioStream[]> => {
  const mapping = malIdSubplMap.get(malId);

  if (!mapping) return null;

  const show = await subsplease.getShow(mapping.slug);
  let torr: ParsedTorrentioStream[] | null = null;

  for (const ep of show.episodes) {
    if (Number(ep.episode) === Number(eid)) {
      const parsedTitle = parse(mapping.title);

      torr = ep.downloads.map(({ res, magnet }) => ({
        info: parsedTitle
          ? { ...parsedTitle, video: { resolution: res, term: undefined } }
          : null,
        magUri: magnet,
      }));
    }
  }

  return torr;
};

export {
  ALLOWED,
  compressTorrent,
  dlAndCompress,
  downloadTorrent,
  getAnimeTorrent,
  getSubplTorrent,
  QUALITY,
};
