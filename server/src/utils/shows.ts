import { randomUUID } from "crypto";
import { DEFAULT_SHOW_POSTER, Episode, Show } from "../models/showModel.js";
import { Response } from "express";
import { SERVER_ERROR } from "./httpCodes.js";

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
}: {
  episodeNumber: number;
  fileUrl: string;
  isCompressed?: boolean;
  publicId: string;
  seasonNumber?: number;
  quality: number;
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

export { addNewShow, addNewEpisode, handler };
