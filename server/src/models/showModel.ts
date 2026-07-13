import { model, Schema } from "mongoose";

export const DEFAULT_SHOW_POSTER = ""

const EpisodeSchema = new Schema({
    fileUrl: {type: String},
    magnetUri: {type: String, required: true},
    isCompressed: {type: Boolean, required: true, default: false},
    publicId: {type: String, required: false},
    quality: {type: Number, required: true},
    fileSize: {type: Number, required: true},
    malId: {required: true, type: String},
    eId: {required: true, type: String},
}, {timestamps: true})

export const Episode = model("episode", EpisodeSchema)