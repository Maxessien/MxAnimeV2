import { Request, Response } from "express";
import { handler } from "../utils/shows.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import axios from "axios";
import { AniZipMetadata } from "../types/anizip.js";
import {
  compressTorrent,
  downloadTorrent,
  getAnimeTorrent,
  QUALITY,
} from "../utils/media.js";
import { Episode } from "../models/showModel.js";

const downloadEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { dl_quality, mal_id } = req.query;

    if (!mal_id || !dl_quality)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or dl_quality" });

    if (!QUALITY[dl_quality.toString()])
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid dl_quality" });

    const ep = await Episode.findOne({
      malId: mal_id.toString(), quality: Number(dl_quality.toString())
    }).lean();

    if (!ep)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Episode not found" });

    if (ep.isCompressed)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ url: ep.fileUrl, size: ep.fileSize });

    const vid = await downloadTorrent(ep?.magnetUri);

    if (!vid)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Failed to download torrent" });

    const comp = await compressTorrent(vid);

    if (!comp)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Failed to compress torrent" });

    return res.status(SUCCESS.OK).json({url: comp.url, size: comp.size});
  });

const addEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { mal_id, eId, sid } = req.query;

    if (!mal_id || !eId || !sid)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or eId or sid" });

    const hasIdx = await Episode.find({
      malId: mal_id.toString(),
      eId: eId.toString(),
      sId: sid.toString(),
    }).lean();

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
      sid.toString(),
      eId.toString(),
    );

    const eps = await Episode.insertMany(
      filteredQuality.map((v) => ({
        eId: eId.toString(),
        sId: sid.toString(),
        isCompressed: false,
        magnetUri: v.magUri,
        malId: mal_id.toString(),
        quality: v.info?.video.resolution?.toLowerCase().replace("p", ""),
      })),
    );
    return res.status(200).json(eps);
  });

export { downloadEpisode, addEpisode };
