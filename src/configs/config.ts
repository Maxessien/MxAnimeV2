import { config } from "dotenv";

config()

import Cloudinary from "cloudinary";
import { offlineCloudinary } from "offline-cloudinary";
import mongoose from "mongoose";
import Seedr from "seedr";


let seedr = new Seedr();
await seedr.login(process.env.SEEDR_EMAIL, process.env.SEEDR_PASS);

const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : Cloudinary.v2.uploader

mongoose.connect(process.env.MONGO_URI || "")

export {mongoose, uploader, seedr}