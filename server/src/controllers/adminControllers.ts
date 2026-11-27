import { Request, Response } from "express";
import { handler } from "../utils/shows.js";
import { CLIENT_ERROR, SUCCESS } from "../utils/httpCodes.js";
import { downloadAbortControllers, downloadTasks } from "../configs/config.js";
import { TaskCanceller, Tasks } from "../types/show.js";

const cancelTask = (req: Request, res: Response) => handler(res, async () => {
  const id = Number(req.params.id)
  if (!Number.isFinite(id)) return res.status(CLIENT_ERROR.BAD_REQUEST).json("ID is missing")

  const controller = downloadAbortControllers.get(id)
  if (!controller) return res.status(CLIENT_ERROR.NOT_FOUND).json("Task not found")

  controller.globalController.abort()
  
  return res.sendStatus(SUCCESS.OK)
})

const getAllTasks = (req: Request, res: Response) =>
  handler(res, async () => {
    const map: Omit<Tasks, "signal">[] = [];

    for (
      const [_, { epInfo, progress, stage, status, filename }] of downloadTasks.entries()
    ) {
      map.push({epInfo, progress, stage, status, filename})
    }

    return res.status(SUCCESS.OK).json(map);
  });

const cancelStage = (req: Request, res: Response) => handler(res, async () => {
  const { stage, task_id } = req.query

  if (!stage || task_id)
    return res.status(CLIENT_ERROR.BAD_REQUEST).json("stage or task id missing")

  const allowedstages: (keyof TaskCanceller["stageControllers"])[] =
    ["apify", "cloudConvert", "ffmpeg", "pikpak", "seedr"]

  if (!allowedstages.includes(stage.toString() as typeof allowedstages[0]))
    return res.status(CLIENT_ERROR.BAD_REQUEST).json("Invalid stage")

  const stageTyped = stage as typeof allowedstages[0]
  const parsedId = Number(task_id)

  if (!Number.isFinite(parsedId))
    return res.status(CLIENT_ERROR.BAD_REQUEST).json("Invalid task id")

  const controller = downloadAbortControllers.get(parsedId)

  if (!controller) return res.status(CLIENT_ERROR.NOT_FOUND).json("Controller not found")

  controller.stageControllers[stageTyped]?.abort()
  
  return res.sendStatus(SUCCESS.OK)
})

export {cancelTask, getAllTasks, cancelStage}
