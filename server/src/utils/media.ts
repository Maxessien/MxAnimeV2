import { UploadApiResponse } from "cloudinary";
import { SeedrVideo } from "seedr";
import {
  CLOUDFARE_APP_BUCKET,
  CLOUDFARE_URL,
  cloudflareClient,
  ffmpeg,
  seedr,
} from "../configs/config.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FfprobeData } from "@ts-ffmpeg/fluent-ffmpeg";
import { createMagnetUri, getTorrentioApi } from "./shows.js";
import { ThirdPartyMappings } from "../types/anizip.js";
import {
  ParsedTorrentioStream,
  TorrentioResponse,
} from "../types/torrentio.js";
import axios from "axios";
import { parse } from "anitomy";
import { Upload } from "@aws-sdk/lib-storage";
import { createReadStream, createWriteStream, promises as fs } from "fs";
import path from "path";
import os from "os";

const downloadTorrent = async (magnetUri: string) => {
  const res = await seedr.addMagnet(magnetUri);
  const vids = await seedr.getVideos();

  return (
    vids
      .flat()
      .find(
        ({ name }) =>
          res.title.trim().toLowerCase() === name.trim().toLowerCase(),
      ) ?? null
  );
};

const compressTorrent = async (
  vid: SeedrVideo,
  fileName?: string,
): Promise<
  | (FfprobeData["format"] & { url: string; key: string; bucket: string })
  | undefined
> => {
  console.log("compressTorrent", vid.id);

  const file = await seedr.getFile(vid.id);
  const key = `videos/${fileName ?? randomUUID()}.mkv`;

  // Create a temporary local path to store the processed video
  const tempInpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);
  const tempOutpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);

  // Download the input file to the temporary input path
  const response = await axios.get(file.url, { responseType: "stream" });

  await new Promise<void>((resolve, reject) => {
    const writer = createWriteStream(tempInpPath);
    response.data.pipe(writer);
    writer.on("finish", () => {
      console.log("Download finished successfully.");
      resolve();
    });
    writer.on("error", (err) => {
      console.error("Write stream error during download:", err);
      reject(err);
    });
  });

  try {
    // 1. Run Ffmpeg and output to local temp file
    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempInpPath)
        .videoCodec("libx265") // Switched to high-efficiency HEVC
        .audioCodec("aac")
        .outputOptions("-crf 24")
        .outputOptions("-preset medium")
        .audioChannels(2)
        .audioBitrate("96k")
        .format("matroska")
        .on("start", (command) => console.log("ffmpeg start", command))
        .on("error", (err) => {
          console.error("ffmpeg error", err);
          reject(err);
        })
        .on("progress", ({ percent }) =>
          console.log(`${percent ? percent.toFixed(1) : 0}% loading...`),
        )
        .on("end", () => {
          console.log("ffmpeg processing done");
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

    const uploadedFileUrl = `${CLOUDFARE_URL}/${key}`;

    // 3. Probe the file to get its duration, size, etc.
    const info: FfprobeData = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempOutpPath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    return {
      ...info.format,
      url: uploadedFileUrl,
      key,
      bucket: CLOUDFARE_APP_BUCKET,
    };
  } catch (error) {
    console.error("Compression / Upload process failed:", error);
    throw error;
  } finally {
    // 4. Always clean up the local temp file to avoid running out of disk space
    try {
      await fs.unlink(tempInpPath);
      await fs.unlink(tempOutpPath);
      console.log("Cleaned up temp file:", tempInpPath, tempOutpPath);
    } catch (cleanupErr) {
      // Temp file might not have been created if it failed early
    }
  }
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
  clnUpTorrent,
  compressTorrent,
  downloadTorrent,
  getAnimeTorrent,
  ALLOWED,
  QUALITY,
};
