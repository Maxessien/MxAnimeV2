import { Router } from "express";
import { downloadEpisode, addEpisode, getDownloadStatus, getAllTasks } from "../controllers/showsControllers.js";


const router = Router()

router.get("/download", downloadEpisode)
router.post("/ep", addEpisode)
router.get("/status/:id", getDownloadStatus)
router.get("/tasks", getAllTasks)

const showRoutes = router

export default showRoutes
