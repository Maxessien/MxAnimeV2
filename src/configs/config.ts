import { config } from "dotenv";

config()

import Cloudinary from "cloudinary";
import { offlineCloudinary } from "offline-cloudinary";
import mongoose from "mongoose";
import Seedr from "seedr";
import ffmpeg from "@ts-ffmpeg/fluent-ffmpeg";
import { resolveFfmpegBinaryPath } from "../utils/media.js";


let seedr = new Seedr();
await seedr.login(process.env.SEEDR_EMAIL, process.env.SEEDR_PASS);

ffmpeg.setFfmpegPath(resolveFfmpegBinaryPath() ?? "")

const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : Cloudinary.v2.uploader

mongoose.connect(process.env.MONGO_URI || "")

export {mongoose, uploader, seedr, ffmpeg}