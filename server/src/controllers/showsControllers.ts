import { Request, Response } from "express";
import { createMagnetUri, getTorrentioApi, handler } from "../utils/shows.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import { readFile } from "fs/promises";
import axios from "axios";
import {
  ParsedTorrentioStream,
  TorrentioResponse,
} from "../types/torrentio.js";
import { parse } from "anitomy";
import { AniZipMetadata } from "../types/anizip.js";
import { compressTorrent, downloadTorrent } from "../utils/media.js";
import { Episode } from "../models/showModel.js";

const downloadEpisode = async (req: Request, res: Response) =>
  handler(res, async () => {
    const { mal_id, eId, sid, should_compress, dl_quality } = req.query;

    if (!mal_id || !eId || !sid)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid mal_id or eId" });

    const {
      data: { mappings },
    } = await axios.get<AniZipMetadata>(
      `https://api.ani.zip/mappings?mal_id=${mal_id}`,
    );

    if (!mappings.imdb_id && !mappings.themoviedb_id)
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "ID not found" });

    const torrentioUrl = getTorrentioApi(
      `${mappings.imdb_id || mappings.themoviedb_id}:${sid}:${eId}`,
      "series",
    );

    const { data: torrRes } = await axios.get<TorrentioResponse>(torrentioUrl);

    const quality: Record<string, boolean> = {
      1080: false,
      720: false,
      480: false,
      360: false,
    };

    const allowed = Object.entries(quality).map((v) => v[0]);

    const parsed: ParsedTorrentioStream[] = torrRes.streams.map((v) => ({
      info: v.name ? parse(v.name) : null,
      magUri:
        v.infoHash && v.sources ? createMagnetUri(v.infoHash, v.sources) : null,
      ...v,
    }));

    const filteredQuality: ParsedTorrentioStream[] = [];

    for (let info of parsed) {
      if (quality[1080] && quality[720] && quality[360] && quality[480]) break;

      let resolution = info.info?.video?.resolution
        ?.toLowerCase()
        ?.replace("p", "");

      if (resolution && allowed.includes(resolution) && quality[resolution])
        filteredQuality.push(info);
    }

    if (should_compress && allowed.includes(dl_quality?.toString() || "")) {
      let map = filteredQuality.find(
        (v) =>
          v.info?.video.resolution?.toLowerCase().replace("p", "") ===
          dl_quality?.toString(),
      );
      if (!map || !map.magUri)
        return res
          .status(CLIENT_ERROR.BAD_REQUEST)
          .json({ message: "Quality not found" });

      const vid = await downloadTorrent(map.magUri);

      if (!vid)
        return res
          .status(CLIENT_ERROR.BAD_REQUEST)
          .json({ message: "Failed to download torrent" });

      const comp = await compressTorrent(vid);

      await Episode.insertOne({
        eId: eId.toString(),
        fileUrl: comp?.secure_url || comp?.url,
        isCompressed: true,
        magnetUri: map.magUri,
        malId: mal_id.toString(),
        fileSize: comp?.bytes,
        publicId: comp?.public_id,
        quality: Number(dl_quality),
      });
    }

    return res.status(SUCCESS.OK);
  });

const getEpisode = async (req: Request, res: Response) =>
  handler(res, async () => res.status(200));

export { downloadEpisode };
