import { Router } from "express";
import {
  createStory,
  listStories,
  viewStory,
  updateStory,
  deleteStory,
  getStoryViewers,
} from "../controller/storyController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  handleStoryUploadError,
  uploadStoryMedia,
} from "../middleware/storyUploadMiddleware.js";

export const router = Router();

router.use(requireAuth);
router.get("/", listStories);
router.post("/", uploadStoryMedia, createStory);
router.get("/:id/viewers", getStoryViewers);
router.put("/:id", uploadStoryMedia, updateStory);
router.delete("/:id", deleteStory);
router.post("/:id/view", viewStory);

router.use(handleStoryUploadError);
