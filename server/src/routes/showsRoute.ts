import { Router } from "express";
import { getShows } from "../controllers/showsControllers.js";


const router = Router()

router.get("/", getShows)

const showRoutes = router

export default showRoutes