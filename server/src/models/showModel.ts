import { Schema } from "mongoose";

const DEFAULT_SHOW_POSTER = ""


const showModel = new Schema({
    fileId: {required: true, type: String},
    posterUrl: {required: true, type: String, default: DEFAULT_SHOW_POSTER},
    // seasons: {required: true, type: }
})