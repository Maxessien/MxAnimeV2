import { config } from "dotenv";
config()

import { S3Client } from "@aws-sdk/client-s3";
import ffmpeg from "@ts-ffmpeg/fluent-ffmpeg";
import { v2 as cloudinary } from "cloudinary";
import ffprobe from "ffprobe-static";
import mongoose from "mongoose";
import { Tasks } from "../types/show.js";
import { resolveFfmpegBinaryPath } from "../utils/ffmpegUtil.js";
import { readFileSync } from "node:fs";
import { createSubsplease } from "@maxessien/subsplease";
import { SeedrClient } from "@maxessien/seedr";
import CloudConvert from "cloudconvert";
import {ApifyClient} from "apify-client"
import { getEnvWithThrow } from "../utils/serverInit.js";
import { parse } from "anitomy";
import Ptt from "parse-torrent-title"

const cloudflareAccessKey = getEnvWithThrow("CLOUDFARE_ACCESS_KEY");
const cloudflareSecretKey = getEnvWithThrow("CLOUDFARE_SECRET_KEY");
const CLOUDFARE_URL =
  "https://dc18e8090b44f06d5139bf4673fc3e4b.r2.cloudflarestorage.com";
const CLOUDFARE_APP_BUCKET = "mxanime";

const cloudflareClient = new S3Client({
  region: "auto",
  forcePathStyle: true,
  endpoint: CLOUDFARE_URL,
  credentials: {
    accessKeyId: cloudflareAccessKey,
    secretAccessKey: cloudflareSecretKey,
  },
});

// Parse CLOUDINARY_URL and configure
const cloudinaryUrl = getEnvWithThrow("CLOUDINARY_URL");
const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (urlMatch) {
  cloudinary.config({
    api_key: urlMatch[1],
    api_secret: urlMatch[2],
    cloud_name: urlMatch[3],
  });
}

const ffmpegPath = resolveFfmpegBinaryPath()

ffmpeg.setFfmpegPath(ffmpegPath ?? "");
ffmpeg.setFfprobePath(ffprobe.path);

const uploader = cloudinary.uploader;

try {
  await mongoose.connect(getEnvWithThrow("MONGO_URI"));
  console.log("Connected to mongodb server");
} catch (err) {
  console.log(err);
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

const downloadTasks: Map<number, Tasks> = new Map();

const malIdSubplMap = new Map<
  number | string,
  { title: string; slug: string }
>();

let file = JSON.parse(readFileSync("subsplease-mal-map.json").toString());

for (const entry of file) {
  if (entry.mal_id)
    malIdSubplMap.set(entry.mal_id, { title: entry.title, slug: entry.subpleaseSlug });
}

const subsplease = createSubsplease();
const seedrCl = await SeedrClient.login(
  getEnvWithThrow("SEEDR_EMAIL"),
  getEnvWithThrow("SEEDR_PASS"),
);

const cloudConvertKeys = (() => {
  const env = getEnvWithThrow("CL_API_KEY");

  try {
    const parsed = JSON.parse(env)

    if (typeof parsed === "string") {
      return [parsed];
    }
    if (Array.isArray(parsed) && parsed.every((k) => typeof k === "string") && parsed.length > 0) {
      return parsed;
    }
    throw new Error("CL_API_KEY must be a string or array of strings");
  } catch (err) {
    return [env];
  }
})()

const getCloudConvert = async () => {
  console.log(cloudConvertKeys)
  for (const key of cloudConvertKeys) {
    try {
      const cloudConvert = new CloudConvert(key);
      const user = await cloudConvert.users.me();
      const credits = user.credits;
      if (credits > 0) {
        return cloudConvert;
      }
    } catch (err) {
      console.error(err);
      continue;
    }
  }
};

const apifyClient = new ApifyClient({ token: getEnvWithThrow("APIFY_API_TOKEN") })
const APIFY_ACTOR_ID = "logical_discovery/mxanimetor"

const anitomyParser = parse
const pttParser = Ptt.parse

export {
  getEnvWithThrow,
  CLOUDFARE_APP_BUCKET,
  CLOUDFARE_URL,
  cloudflareSecretKey,
  cloudflareAccessKey,
  cloudflareClient,
  downloadTasks,
  ffmpeg,
  mongoose,
  seedrCl,
  uploader,
  malIdSubplMap,
  subsplease,
  apifyClient,
  APIFY_ACTOR_ID,
  anitomyParser, pttParser, getCloudConvert
};
