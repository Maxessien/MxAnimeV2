import { config } from "dotenv";

config()

import Cloudinary from "cloudinary";
import { offlineCloudinary } from "offline-cloudinary";
import mongoose from "mongoose";

const uploader = process.env.NODE_ENV === "development" ? offlineCloudinary : Cloudinary.v2.uploader

mongoose.connect(process.env.MONGO_URI || "")

export {mongoose, uploader}