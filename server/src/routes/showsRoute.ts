import { Router } from "express";
import { downloadEpisode, addEpisode } from "../controllers/showsControllers.js";


const router = Router()

router.get("/download", downloadEpisode)
router.post("/ep", addEpisode)

const showRoutes = router

export default showRoutes
