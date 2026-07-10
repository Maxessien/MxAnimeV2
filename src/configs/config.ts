import { config } from "dotenv";

config()

import ffmpeg from "@ts-ffmpeg/fluent-ffmpeg";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Seedr from "seedr";
import { resolveFfmpegBinaryPath } from "../utils/ffmpegUtil.js";

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

ffmpeg.setFfmpegPath(resolveFfmpegBinaryPath() ?? "")

// const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : cloudinary.uploader
const uploader = cloudinary.uploader

mongoose.connect(process.env.MONGO_URI || "")

export { ffmpeg, mongoose, seedr, uploader };
