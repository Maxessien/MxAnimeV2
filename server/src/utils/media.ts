import { Upload } from "@aws-sdk/lib-storage";
import { FfprobeData } from "@ts-ffmpeg/fluent-ffmpeg";
import { parse } from "anitomy";
import axios from "axios";
import { randomUUID } from "crypto";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import { _QueryFilter } from "mongoose";
import os from "os";
import path from "path";
import { SeedrVideo } from "seedr";
import {
  CLOUDFARE_APP_BUCKET,
  cloudflareClient,
  downloadTasks,
  ffmpeg,
  seedr,
} from "../configs/config.js";
import { Episode } from "../models/showModel.js";
import { ThirdPartyMappings } from "../types/anizip.js";
import { Tasks } from "../types/show.js";
import {
  ParsedTorrentioStream,
  PikPakMediaLink,
  PikPakResponse,
  PikPakTaskResponse,
  SeedrTransfer,
  TorrentioResponse,
} from "../types/torrentio.js";
import { createMagnetUri, getTorrentioApi } from "./shows.js";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL;

const pollForProg = async (
  fileId: string,
  taskId: string,
  pollUpdate: (prog: number) => void,
) => {
  let transfer: PikPakResponse | undefined;

  let prog = 0;
  let progInc = 21;
  
    console.log(fileId, taskId)

  while (!transfer || transfer.status !== "done") {
    const { data } = await axios.get<PikPakResponse>(
      `${PYTHON_SERVER_URL}/status`,
      {
        params: { file_id: fileId, task_id: taskId },
      },
    );
    pollUpdate(prog);
    transfer = data;

    if ((prog + progInc) < 99) prog += progInc;

    if (progInc > 1) progInc -= 5;
  }

  pollUpdate(100)

  return transfer;
};

const downloadTorrent = async (
  magnetUri: string,
  epInfo: Tasks["epInfo"],
  taskId: number,
  baseProg: number = 0,
  maxProg: number = 25,
) => {
  // const { data } = await axios.post<PikPakTaskResponse>(`${PYTHON_SERVER_URL}/task`, {magUri: magnetUri})
  const data = {
  callback: '',
  created_time: '2026-08-23T05:08:46.886+08:00',
  file_id: 'VP-fIUvMpMQjt_gRbkBAN-vTo2',
  file_name: '[SubsPlease] Seihantai na Kimi to Boku - 16 (480p) [A7750FD7].mkv',
  file_size: '390979885',
  icon_link: '',
  id: 'VP-fIUuapMQjt_gRbkBAN-vRo2',
  kind: 'drive#task',
  message: 'Saving',
  name: '[SubsPlease] Seihantai na Kimi to Boku - 16 (480p) [A7750FD7].mkv',
  params: { predict_speed: '73300775185', predict_type: '3' },
  phase: 'PHASE_TYPE_RUNNING',
  progress: 0,
  space: '',
  status_size: 1,
  statuses: [],
  third_task_id: '',
  type: 'offline',
  updated_time: '2026-08-23T05:08:46.886+08:00',
  user_id: 'ajkiHm3BXtONwUyG'
}
    console.log(data)
  let tr = await pollForProg(
    data.file_id,
    data.id,
    (prog) => {
      downloadTasks.set(taskId, {
        epInfo,
        progress: prog * ((maxProg - baseProg) / 100) + baseProg,
        status: "pending",
      });
    },
  );

  return tr.info
};

const compressTorrent = async (
  vid: PikPakMediaLink,
  taskId: number,
  epInfo: Tasks["epInfo"],
  fileName?: string,
  baseProg: number = 25,
  maxProg: number = 100,
): Promise<void> => {
  console.log("compressTorrent", vid);

  const key = `videos/${fileName ?? randomUUID()}.mkv`;

  // Create a temporary local path to store the processed video
  const tempInpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);
  const tempOutpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);

  // Download the input file to the temporary input path
  const response = await axios.get(vid.url, { responseType: "stream" });

  await new Promise<void>((resolve, reject) => {
    const writer = createWriteStream(tempInpPath);
    response.data.pipe(writer);
    writer.on("finish", () => {
      console.log("Download finished successfully.");
      downloadTasks.set(taskId, {
        epInfo,
        status: "pending",
        progress: 10 * ((maxProg - baseProg) / 100) + baseProg,
      });
      resolve();
    });
    writer.on("error", (err) => {
      console.error("Write stream error during download:", err);
      downloadTasks.set(taskId, {
        epInfo,
        status: "error",
        progress: 10 * ((maxProg - baseProg) / 100) + baseProg,
      });
      reject(err);
    });
  });

  try {
    // 1. Run Ffmpeg and output to local temp file
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInpPath)
        .videoCodec("libx265") // Switched to high-efficiency HEVC
        .audioCodec("aac")
        .outputOptions("-crf 26")
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
          downloadTasks.set(taskId, {
            epInfo,
            status: "error",
            progress: downloadTasks.get(taskId)?.progress || 10,
          });
          reject(err);
        })
        .on("progress", ({ percent }) => {
          if (percent)
            downloadTasks.set(taskId, {
              epInfo,
              status: "pending",
              progress:
                percent * ((maxProg - baseProg - 10) / 100) + baseProg + 10,
            });
        })
        .on("end", () => {
          console.log("ffmpeg processing done");
          downloadTasks.set(taskId, {
            epInfo,
            status: "pending",
            progress: 90 * ((maxProg - baseProg) / 100) + baseProg,
          });
          resolve();
        })
        .save(tempOutpPath); // Saves directly to local storage safely
    });

    // 2. Upload the finished file to Cloudflare R2 using AWS Lib-Storage Upload
    console.log("Uploading file to Cloudflare R2...");
    const fileStream = createReadStream(tempOutpPath);

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
    console.log("Upload completed successfully");

    downloadTasks.set(taskId, {
      epInfo,
      status: "pending",
      progress: 95 * ((maxProg - baseProg) / 100) + baseProg,
    });

    const uploadedFileUrl = `https://pub-991c552c64ed424ebd8971019038f0ad.r2.dev/${key}`;

    // 3. Probe the file to get its duration, size, etc.
    const info: FfprobeData = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempOutpPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

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
        fileSize: info.format.size,
      },
    );

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
  const vid = await downloadTorrent(magUri, epInfo, taskId);

  if (!vid) {
    downloadTasks.set(taskId, { epInfo, progress: 0, status: "error" });
    throw new Error("Failed to download torrent");
  }

  await compressTorrent(vid?.[0], taskId, epInfo);
};

const clnUpTorrent = async (id: string | number, maxRetries: number = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    const contents = await seedr.deleteFile(id);

    if (contents.result && contents.success) return contents;
  }
};

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

export {
  ALLOWED,
  clnUpTorrent,
  compressTorrent,
  dlAndCompress,
  downloadTorrent,
  getAnimeTorrent,
  QUALITY,
};
