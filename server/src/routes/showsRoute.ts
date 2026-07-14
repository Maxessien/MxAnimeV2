import { Router } from "express";
import { downloadEpisode } from "../controllers/showsControllers.js";


const router = Router()

router.get("/download", downloadEpisode)
router.post("/download", downloadEpisode)

const showRoutes = router

export default showRoutes
