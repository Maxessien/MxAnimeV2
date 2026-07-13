import { Request, Response } from "express";
import { getSeasonNumber, getTorrentioApi, handler } from "../utils/shows.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import { readFile } from "fs/promises";

const downloadEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { mal_id, eid } = req.query;
    const mapping = JSON.parse((await readFile("mappings1.json")).toString());
    const map = new Map<string, number>(Object.entries(mapping));

    if (!mal_id || !eid)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or eid" });

    const season = await getSeasonNumber(mal_id.toString());

    const torrentioUrl = getTorrentioApi(
      `${mal_id}:${season}:${eid}`,
      "series",
    );

    return res.status(SUCCESS.OK);
  });

const getEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {});

export {};
