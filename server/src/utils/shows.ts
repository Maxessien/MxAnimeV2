import { Response } from "express";
import { SERVER_ERROR } from "./httpCodes.js";
import axios from "axios";
import { downloadAbortControllers } from "../configs/config.js";

const JIKAN_API = "https://api.jikan.moe/v4";

const getAniZipUrl = (malId: number | string) =>
  `https://api.ani.zip/mappings?mal_id=${malId}`;

const handler = async<T>(res: Response, cb: () => Promise<T | Response>): Promise<T | Response> => {
  try {
    const resp = await cb();
    return resp;
  } catch (error) {
    console.log(error);
    return res
      .status(SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json(error);
  }
};

const signalPromise = async(signal: AbortSignal) => {
  let resolve = false

  signal.onabort = (_) => resolve = true

  while (!resolve) {}
}

const getDlControllerWithThrow = (id: number) => {
  const controller = downloadAbortControllers.get(id)

  if (!controller) throw new Error("Controller not found")
  else return controller
}

const getTorrentioApi = (id: string, type: string) =>
  `https://torrentio.strem.fun/stream/${type}/${id}.json`;


const createMagnetUri = (
  infoHash: string,
  sources: string[] = []
): string => {
  const params = new URLSearchParams();

  for (const source of sources) {
    params.append("tr", source);
  }

  const query = params.toString();

  return query
    ? `magnet:?xt=urn:btih:${infoHash}&${query}`
    : `magnet:?xt=urn:btih:${infoHash}`;
}


export { handler, signalPromise, getDlControllerWithThrow, JIKAN_API, getAniZipUrl, getTorrentioApi, createMagnetUri };
