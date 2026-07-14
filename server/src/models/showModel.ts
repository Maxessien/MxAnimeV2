import { model, Schema } from "mongoose";

export const DEFAULT_SHOW_POSTER = "";

const EpisodeSchema = new Schema(
  {
    fileUrl: { type: String, required: false },
    magnetUri: { type: String, required: true },
    isCompressed: { type: Boolean, required: true, default: false },
    manageInfo: { type: { key: String, bucket: String }, required: false },
    quality: { type: Number, required: true },
    fileSize: { type: Number, required: false },
    malId: { required: true, type: String },
    eId: { required: true, type: String },
    sId: { required: true, type: String },
  },
  { timestamps: true },
);

export const Episode = model("episode", EpisodeSchema);
