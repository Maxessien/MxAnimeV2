import { randomUUID } from "crypto";
import { DEFAULT_SHOW_POSTER, Episode, Show } from "../models/showModel.js";
import { Response } from "express";
import { SERVER_ERROR } from "./httpCodes.js";

const JIKAN_API = "https://api.jikan.moe/v4"

const getAniZipUrl = (malId: number | string)=> `https://api.ani.zip/mappings?mal_id=${malId}`

const addNewShow = async (
  synopsis: string,
  title: string,
  posterUrl: string = DEFAULT_SHOW_POSTER,
  releaseDate: Date,
) => {
  return await Show.create({
    epCount: 0,
    showId: randomUUID(),
    synopsis,
    posterUrl,
    releaseDate,
    title,
  });
};

const addNewEpisode = async ({
  episodeNumber,
  fileUrl,
  isCompressed = false,
  publicId,
  seasonNumber = 0,
  showId,
  quality,
  fileSize,
}: {
  episodeNumber: number;
  fileUrl: string;
  isCompressed?: boolean;
  publicId: string;
  seasonNumber?: number;
  quality: number;
  fileSize: number;
  showId: string;
}) => {
  let ep = await Episode.create({
    episodeNumber,
    fileUrl,
    isCompressed,
    publicId,
    seasonNumber,
    showId,
    quality,
    fileSize,
  });

  await Show.updateOne({ showId }, { $inc: { epCount: 1 } });

  return ep;
};

const handler = async (res: Response, cb: () => Promise<Response>) => {
  try {
    const resp = await cb();
    return resp;
  } catch (error) {
    console.log(error);
    return res
      .status(SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};

export { addNewShow, addNewEpisode, handler, JIKAN_API, getAniZipUrl };
