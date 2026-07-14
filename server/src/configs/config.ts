import { config } from "dotenv";

config();

import ffmpeg from "@ts-ffmpeg/fluent-ffmpeg";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Seedr from "seedr";
import { resolveFfmpegBinaryPath } from "../utils/ffmpegUtil.js";
import { S3Client } from "@aws-sdk/client-s3";
import ffprobe from "ffprobe-static";

const cloudflareAccessKey = process.env.CLOUDFARE_ACCESS_KEY || "";
const cloudflareSecretKey = process.env.CLOUDFARE_SECRET_KEY || "";
const CLOUDFARE_URL =
  "https://dc18e8090b44f06d5139bf4673fc3e4b.r2.cloudflarestorage.com";
const CLOUDFARE_APP_BUCKET = "mxanime";

const cloudflareClient = new S3Client({
  region: "us-east-1",
  endpoint: CLOUDFARE_URL,
  credentials: {
    accessKeyId: cloudflareAccessKey,
    secretAccessKey: cloudflareSecretKey,
  },
});

// Parse CLOUDINARY_URL and configure
const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
const urlMatch = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
if (urlMatch) {
  cloudinary.config({
    api_key: urlMatch[1],
    api_secret: urlMatch[2],
    cloud_name: urlMatch[3],
  });
}

let seedr = new Seedr();
await seedr.login(process.env.SEEDR_EMAIL, process.env.SEEDR_PASS);

ffmpeg.setFfmpegPath(resolveFfmpegBinaryPath() ?? "");
ffmpeg.setFfprobePath(ffprobe.path);

// const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : cloudinary.uploader
const uploader = cloudinary.uploader;

try {
  await mongoose.connect(process.env.MONGO_URI || "");
  //mongoose.connection.dropDatabase();
  console.log("Connected to mongodb server");
} catch (err) {
  console.log(err);
}

mongoose.connection.on("error", (err) => {
  console.error("MongoDB error:", err);
});

export {
  ffmpeg,
  mongoose,
  seedr,
  uploader,
  CLOUDFARE_APP_BUCKET,
  CLOUDFARE_URL,
  cloudflareClient,
};
