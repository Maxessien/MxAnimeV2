import { Request, Response } from "express";
import { handler } from "../utils/shows.js";
import { Show } from "../models/showModel.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import { SortOrder } from "mongoose";

const getShows = async (req: Request, res: Response) =>
  handler(res, async () => {
    const {
      page,
      limit = "10",
      search = undefined,
      sortBy = "title",
      direction = "asc",
    } = req.query;

    if (!Number.isFinite(Number(limit)) || !Number.isFinite(Number(page)))
      return res
        .status(CLIENT_ERROR.BAD_REQUEST)
        .json({ message: "Invalid page number" });

    const parsedSortBy = ["title", "createdAt"].includes(sortBy?.toString())
      ? sortBy.toString()
      : "title";
    
    const parsedDirection: SortOrder = ["asc", "desc"].includes(
      direction?.toString(),
    )
      ? (direction.toString() as SortOrder)
      : "asc";

    const filter = {
      ...(search?.toString().trim()
        ? { title: { $regex: search?.toString() } }
        : {}),
    };

    const [shows, total] = await Promise.all([
      Show.find(filter)
        .limit(Number(limit))
        .sort([[parsedSortBy, parsedDirection]])
        .skip(Number(page) * Number(limit))
        .lean(),

      Show.find(filter).countDocuments(),
    ]);

    return res.status(SUCCESS.OK).json({shows, total});
  });

export { getShows };
