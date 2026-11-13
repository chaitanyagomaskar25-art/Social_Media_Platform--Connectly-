import { Router } from "express";
import { getCreatorAnalytics } from "../controller/analyticsController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = Router();

router.get("/", requireAuth, getCreatorAnalytics);

export default router;
