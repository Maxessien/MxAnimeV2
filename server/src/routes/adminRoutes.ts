import { Router } from "express";
import { cancelStage, cancelTask, getAllTasks } from "../controllers/adminControllers.js";


const router = Router()

router.get("/tasks", getAllTasks)
router.delete("/task/:id", cancelTask)
router.delete("/stage", cancelStage)

const adminRoutes = router

export default adminRoutes
