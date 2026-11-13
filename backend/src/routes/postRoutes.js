
import { Router } from "express";
import {
  getFeed,
  getPostById,
  createPost,
  likePost,
    updatePost,

  unlikePost,
  deletePost,
  getUserPosts,
  searchPosts,getTrendingHashtags
} from "../controller/postController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { optionalAuth } from "../middleware/optionalAuth.js";
import {router as commentRoutes} from "./commentRoutes.js";
import { uploadPostMedia } from '../middleware/uploadMiddleware.js';

export const router = Router();

router.get("/feed", optionalAuth, getFeed);
router.get("/user/:userId", optionalAuth, getUserPosts);

router.post("/", requireAuth, uploadPostMedia, createPost);
router.put("/:id", requireAuth, uploadPostMedia, updatePost);
router.get("/search", optionalAuth, searchPosts);
router.get("/trending-hashtags", getTrendingHashtags);

router.post("/:id/like", requireAuth, likePost);
router.delete("/:id/like", requireAuth, unlikePost);

router.get("/:id", optionalAuth, getPostById);

// Nested comment endpoints
router.use("/:postId/comments", commentRoutes);

router.delete("/:id", requireAuth, deletePost);
