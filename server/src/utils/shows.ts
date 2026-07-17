import { Response } from "express";
import { SERVER_ERROR } from "./httpCodes.js";
import axios from "axios";
import { console } from "node:inspector";

const JIKAN_API = "https://api.jikan.moe/v4";

const getAniZipUrl = (malId: number | string) =>
  `https://api.ani.zip/mappings?mal_id=${malId}`;

const handler = async (res: Response, cb: () => Promise<Response>): Promise<Response> => {
  try {
    const resp = await cb();
    return resp;
  } catch (error) {
    console.log(error, "rrrt");
    return res
      .status(SERVER_ERROR.INTERNAL_SERVER_ERROR)
      .json(error);
  }
};

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


export { handler, JIKAN_API, getAniZipUrl, getTorrentioApi, createMagnetUri };
