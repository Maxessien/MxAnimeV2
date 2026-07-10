import { model, Schema } from "mongoose";

export const DEFAULT_SHOW_POSTER = ""

const EpisodeSchema = new Schema({
    episodeNumber: {type: Number, required: true},
    fileUrl: {type: String, required: true},
    isCompressed: {type: Boolean, required: true, default: false},
    publicId: {type: String, required: false},
    seasonNumber: {type: Number, required: true},
    quality: {type: Number, required: true},
    showId: {required: true, type: String},
}, {timestamps: true})

const ShowSchema = new Schema({
    showId: {required: true, type: String},
    title: {required: true, type: String},
    posterUrl: {required: true, type: String, default: DEFAULT_SHOW_POSTER},
    epCount: {type: Number, required: true},
    synopsis: {type: String, required: true},
    releaseDate: {type: Date, required: true, default: ()=> new Date(Date.now())},
}, {timestamps: true})

export const Show = model("show", ShowSchema)

export const Episode = model("show", EpisodeSchema)