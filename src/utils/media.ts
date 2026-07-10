import { existsSync } from "fs";
import { ffmpeg, seedr } from "../configs/config.js";
import ffmpegPath from "ffmpeg-static";
import path from "path";
import { SeedrVideo } from "seedr";
import os from "os";

const resolveFfmpegBinaryPath = (): string | null => {
  const candidates = [
    ffmpegPath,
    path.join(
      process.cwd(),
      "node_modules",
      "ffmpeg-static",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg",
    ),
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length === 0) {
      continue;
    }

    const normalizedPath = path.normalize(candidate);
    if (existsSync(normalizedPath)) {
      return normalizedPath;
    }
  }

  return null;
};

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

const compressTorrent = async (vid: SeedrVideo) => {
  const file = await seedr.getFile(vid.id);
  const outputPath = path.join(os.tmpdir(), `${vid.id}_compressed.mp4`);

  return new Promise((resolve, reject) => {
    ffmpeg(file.url)
      .videoCodec("libx264")
      .audioCodec("aac")
      .output(outputPath)
      .on("end", () => {
        resolve(outputPath);
      })
      .on("error", (err) => {
        reject(err);
      })
      .on("progress", ({ percent }) => {
        console.log(percent);
      })
      .run();
  });
};

export { resolveFfmpegBinaryPath, downloadTorrent, compressTorrent };
