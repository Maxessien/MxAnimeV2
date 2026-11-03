import axios from "axios";
import { randomUUID } from "crypto";
import { createWriteStream, existsSync, promises as fs } from "fs";
import { _QueryFilter } from "mongoose";
import os from "os";
import path from "path";
import {
  apifyClient,
  CLOUDFARE_APP_BUCKET,
  cloudflareClient,
  downloadTasks,
} from "../configs/config.js";
import { Episode } from "../models/showModel.js";
import { Tasks } from "../types/show.js";
import { ParsedTorrentioStream } from "../types/torrentio.js";
import { stat } from "fs/promises";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  convertRes,
  downloadTorrent,
  downloadTorrentSeedr,
  downloadTorrentToApify,
} from "./torrentsFetchers.js";
import { compressWithCl, compressWithFfmpeg } from "./compressors.js";

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

const compressTorrent = async (
  vid: { url: string },
  taskId: number,
  epInfo: Tasks["epInfo"],
  shouldSave: boolean = true,
  fileName?: string,
  baseProg: number = 25,
  maxProg: number = 100,
): Promise<void> => {
  const key = `videos/${fileName ?? randomUUID()}.mkv`;
  const scalewidth = convertRes(epInfo.quality);

  // Create a temporary local path to store the processed video
  const tempInpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);
  const tempOutpPath = path.join(os.tmpdir(), `${randomUUID()}.mkv`);

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
      await compressWithCl(key, vid.url, compProg, "url", scalewidth);
      isCompressed = true;
    } catch (err) {
      console.log(err);
    }

    if (!isCompressed) {
      await compressWithFfmpeg(
        vid.url,
        tempOutpPath,
        key,
        compErr,
        compProg,
        scalewidth,
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
      const info =
        isCompressed && !existsSync(tempOutpPath)
          ? await cloudflareClient.send(
              new HeadObjectCommand({ Bucket: CLOUDFARE_APP_BUCKET, Key: key }),
            )
          : { ContentLength: (await stat(tempOutpPath)).size };

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
  let cleanUpApify: (() => Promise<void>) | null = null;

  try {
    const sInfo = await downloadTorrentSeedr(magUri, epInfo, taskId);

    url = sInfo?.url;
    cleanUp = sInfo?.delFn;
  } catch (err) {
    console.log(err);
  }

  if (!url) {
    try {
      const vid = await downloadTorrent(magUri, epInfo, taskId);
      url = vid?.[0]?.url;
    } catch (err) {
      console.log(err);
    }
  }

  if (!url) {
    try {
      const { chosen, defaultKeyValueStoreId, defaultDatasetId } = await downloadTorrentToApify(
        magUri,
        epInfo.episodeId,
      );

      url = chosen.downloadUrl;
      cleanUpApify = ()=> (async() => {
        await apifyClient.keyValueStore(defaultKeyValueStoreId).delete()
        await apifyClient.dataset(defaultDatasetId).delete()
      })()
    } catch (err) {
      console.log(err);
    }
  }

  if (url && typeof url === "string") {
    await compressTorrent({ url }, taskId, epInfo);
    try {
      if (cleanUp) await cleanUp();
    } catch (err) {
      console.log(err);
    }
  } else {
    downloadTasks.set(taskId, { epInfo, progress: 0, status: "error" });
    throw new Error("Failed to download torrent");
  }
};

const generateSmallerResEntries = (entries: ParsedTorrentioStream[]) => {
  const res = [1080, 720, 480, 360];
  const filtered = entries.filter((v) =>
    Number.isFinite(convertRes(v.resolution)),
  );

  if (filtered.length === 0) return entries;
  const smallest = filtered.reduce((prev, curr) =>
    convertRes(prev.resolution) > convertRes(curr.resolution) ? curr : prev,
  );

  const mod: ParsedTorrentioStream[] = res
    .filter((v) => v < convertRes(smallest.resolution))
    .map((v) => ({ magUri: smallest.magUri, resolution: `${v}p` }));

  return [...entries, ...mod];
};

export { compressTorrent, dlAndCompress, generateSmallerResEntries };
