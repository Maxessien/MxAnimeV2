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
  const file = await seedr.getFile(vid.id);

  const key = `videos/${fileName ?? randomUUID()}.mkv`;

  const command = new PutObjectCommand({
    Bucket: CLOUDFARE_APP_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(cloudflareClient, command);

  await new Promise((resolve, reject) => {
    ffmpeg(file.url)
      .output(url)
      .videoCodec("libx264")
      .audioCodec("aac")
      .format("mkv")
      .on("error", reject)
      .on("progress", ({ percent }) => console.log(`${percent}% loading...`))
      .on("end", () => {
        console.log("done");
        resolve("done");
      });
  });

  const uploadedFileUrl = `https://${CLOUDFARE_URL}/${key}`;

  const info: FfprobeData = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(uploadedFileUrl, (err, data) => {
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

const ALLOWED = Object.entries(quality).map((v) => v[0]);

const getAnimeTorrent = async (
  mappings: ThirdPartyMappings,
  sid: string,
  eId: string,
): Promise<{ filteredQuality: ParsedTorrentioStream[]; allowed: string[] }> => {
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

    if (resolution && ALLOWED.includes(resolution) && QUALITY[resolution])
      filteredQuality.push(info);
  }

  return { filteredQuality };
};

export { clnUpTorrent, compressTorrent, downloadTorrent, getAnimeTorrent, ALLOWED, QUALITY };
