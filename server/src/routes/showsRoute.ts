import { Router } from "express";
import { downloadEpisode, addEpisode, getDownloadStatus } from "../controllers/showsControllers.js";


const router = Router()

router.get("/download", downloadEpisode)
router.post("/ep", addEpisode)
router.get("/status/:id", getDownloadStatus)

const showRoutes = router

export default showRoutes
