import express from "express";
import {
  savePost,
  unsavePost,
  getSavedPosts,
  getSavedPostStatus,
} from "../controller/savedPostController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = express.Router();

router.use(requireAuth);

router.get("/", getSavedPosts);
router.get("/:postId/status", getSavedPostStatus);
router.post("/:postId", savePost);
router.delete("/:postId", unsavePost);

