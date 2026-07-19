import axios from "axios";
import { Request, Response } from "express";
import { randomInt } from "node:crypto";
import { downloadTasks } from "../configs/config.js";
import { Episode } from "../models/showModel.js";
import { AniZipMetadata } from "../types/anizip.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import {
  ALLOWED,
  compressTorrent,
  dlAndCompress,
  downloadTorrent,
  getAnimeTorrent,
} from "../utils/media.js";
import { handler } from "../utils/shows.js";

const downloadEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { dl_quality, mal_id, eId, sId } = req.query;

    if (!mal_id || !dl_quality || !eId || !sId)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or dl_quality" });

    let ql = dl_quality.toString();

    if (!ALLOWED.includes(ql))
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid dl_quality" });

    let taskId: number;
    do {
      taskId = randomInt(1_000_000);
    } while (downloadTasks.has(taskId));

    const ep = await Episode.findOne({
      malId: mal_id.toString(),
      quality: Number(dl_quality.toString()),
      eId: eId.toString(),
      sId: sId.toString(),
    }).lean();

    if (!ep)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Episode not found" });

    if (ep.isCompressed)
      return res
        .status(SUCCESS.OK)
        .json({ taskId, episode: ep, isCompressed: true });

    const epInfo = {
      episodeId: Number(eId),
      malId: Number(mal_id),
      quality: dl_quality.toString(),
      season: Number(sId),
    };

    void dlAndCompress(taskId, epInfo, ep.magnetUri).catch((error) => {
      console.error("Episode download task failed:", error);
    });

    downloadTasks.set(taskId, {
      status: "pending",
      progress: 0,
      epInfo,
    });

    return res
      .status(SUCCESS.ACCEPTED)
      .json({ taskId, episode: null, isCompressed: false });
  });

const getDownloadStatus = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { id: taskId } = req.params;

    if (!taskId)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid taskId" });

    const status = downloadTasks.get(Number(taskId));

    if (!status)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Task not found" });

    if (status.status === "completed") {
      let episode = await Episode.findOne({
        malId: status.epInfo.malId.toString(),
        eId: status.epInfo.episodeId,
        sId: status.epInfo.season,
        quality: status.epInfo.quality,
      } as any);

      downloadTasks.delete(Number(taskId));

      return res.status(SUCCESS.OK).json({ episode, status });
    }

    if (status.status === "error") downloadTasks.delete(Number(taskId));

    return res.status(SUCCESS.OK).json({ status, episode: null });
  });

const addEpisode = (req: Request, res: Response) =>
  handler(res, async () => {
    const { mal_id, eId, sId } = req.body;

    if (!mal_id || !eId || !sId)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or eId or sid" });

    const hasIdx = await Episode.find({
      malId: mal_id.toString(),
      eId: eId.toString(),
      sId: sId.toString(),
    })
      .select(["malId", "quality", "eId", "sId"])
      .lean();

    if (hasIdx.length > 0) {
      return res.status(SUCCESS.OK).json(hasIdx);
    }

    const {
      data: { mappings },
    } = await axios.get<AniZipMetadata>(
      `https://api.ani.zip/mappings?mal_id=${mal_id}`,
    );

    if (!mappings.imdb_id && !mappings.themoviedb_id)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "ID not found" });

    const { filteredQuality } = await getAnimeTorrent(
      mappings,
      sId.toString(),
      eId.toString(),
    );

    if (!filteredQuality || filteredQuality.length === 0)
      return res
        .status(CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Torrents not found" });

    const eps = await Episode.insertMany(
      filteredQuality.map((v) => ({
        eId: eId.toString(),
        sId: sId.toString(),
        isCompressed: false,
        magnetUri: v.magUri,
        malId: mal_id.toString(),
        quality: Number(
          v.info?.video.resolution?.toLowerCase().replace("p", ""),
        ),
      })),
    );

    return res.status(SUCCESS.CREATED).json(eps);
  });

export { addEpisode, downloadEpisode, getDownloadStatus };
