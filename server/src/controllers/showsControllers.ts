import axios from "axios";
import { Request, Response } from "express";
import { randomInt } from "node:crypto";
import { downloadTasks } from "../configs/config.js";
import { Episode } from "../models/showModel.js";
import { AniZipMetadata } from "../types/anizip.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import { dlAndCompress, getSubplTorrent } from "../utils/media.js";
import { handler } from "../utils/shows.js";
import { ParsedTorrentioStream } from "../types/torrentio.js";
import { AddQueryQualities, Tasks } from "../types/show.js";

const downloadEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { dl_quality, mal_id, eId, sId } = req.query;

    if (!mal_id || !dl_quality || !eId || !sId)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or dl_quality" });

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
        .json({
          taskId: randomInt(1_000_000),
          episode: ep,
          isCompressed: true,
        });

    const epInfo: Tasks["epInfo"] = {
      episodeId: Number(eId),
      malId: Number(mal_id),
      quality: dl_quality.toString(),
      season: Number(sId),
    };

    let taskExists: (Tasks & { taskId: number }) | undefined;

    for (const [id, tsk] of downloadTasks.entries()) {
      const info = tsk.epInfo;
      if (
        info.episodeId === epInfo.episodeId &&
        info.malId === epInfo.malId &&
        info.quality === epInfo.quality &&
        info.season === epInfo.season
      ) {
        taskExists = { ...tsk, taskId: id };
        break;
      }
    }

    if (taskExists)
      return res
        .status(SUCCESS.CREATED)
        .json({
          taskId: taskExists.taskId,
          episode: null,
          isCompressed: false,
        });

    let taskId: number;

    do {
      taskId = randomInt(1_000_000);
    } while (downloadTasks.has(taskId));

    void dlAndCompress(taskId, epInfo, ep.magnetUri).catch((error) => {
      console.error("Episode download task failed:", error);
      downloadTasks.set(taskId, { status: "error", progress: 0, epInfo });
    });

    downloadTasks.set(taskId, {
      status: "pending",
      progress: 0,
      epInfo,
    });

    return res
      .status(SUCCESS.CREATED)
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
    const { mal_id, eId, sId, qualities } = req.body;

    const qualitiesTyped = qualities as AddQueryQualities[];

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

    let anime: ParsedTorrentioStream[] = [];

    if (!qualitiesTyped || qualitiesTyped.length === 0) {
      let filteredQuality = await getSubplTorrent(mal_id, eId.toString());

      if (filteredQuality) anime = filteredQuality;
    } else
      anime = qualitiesTyped.map(({ magnetUri, quality }) => ({
        magUri: magnetUri,
        resolution: quality,
      }));

    if (anime.length === 0)
      return res
        .status(CLIENT_ERROR.NOT_FOUND)
        .json({ message: "Torrents not found" });

    const eps = await Episode.insertMany(
      anime.map((v) => ({
        eId: eId.toString(),
        sId: sId.toString(),
        isCompressed: false,
        magnetUri: v.magUri,
        malId: mal_id.toString(),
        quality: Number(v.resolution?.toLowerCase().replace("p", "")),
      })),
    );

    return res.status(SUCCESS.CREATED).json(eps);
  });

const getAllTasks = async (req: Request, res: Response) =>
  handler(res, async () => {
    const adminKey = process.env.ADMIN_KEY;

    if (!adminKey || adminKey !== req.query.key?.toString())
      return res.status(CLIENT_ERROR.UNAUTHORIZED).json("Unauthorised access");

    const map = Object.fromEntries(downloadTasks.entries());

    return res.status(SUCCESS.OK).json(map);
  });

export { addEpisode, downloadEpisode, getDownloadStatus, getAllTasks };
