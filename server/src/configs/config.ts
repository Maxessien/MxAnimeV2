// import { config } from "dotenv";
// config()

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

const getEnvWithThrow = (varName: string) => {
  if (!varName || typeof varName !== "string")
    throw new Error("Variable name is required");

  const val = process.env[varName];

  if (!val) throw new Error(`Environment variable ${varName} not found`);
  else return val;
};

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

if (getEnvWithThrow("NODE_ENV") === "production") {
  console.log("Production detected: Forcing native Linux FFmpeg/FFprobe paths");
  ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");
  ffmpeg.setFfprobePath("/usr/bin/ffprobe");
} else {
  ffmpeg.setFfmpegPath(resolveFfmpegBinaryPath() ?? "");
  ffmpeg.setFfprobePath(ffprobe.path);
}

// const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : cloudinary.uploader
const uploader = cloudinary.uploader;

try {
  await mongoose.connect(getEnvWithThrow("MONGO_URI"));
  //mongoose.connection.dropDatabase();
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
    malIdSubplMap.set(entry.mal_id, { title: entry.title, slug: entry.slug });
}

const subsplease = createSubsplease();
const seedrCl = await SeedrClient.login(
  getEnvWithThrow("SEEDR_EMAIL"),
  getEnvWithThrow("SEEDR_PASS"),
);
const cloudConvert = new CloudConvert(getEnvWithThrow("CL_API_KEY"));

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
  cloudConvert,
};
