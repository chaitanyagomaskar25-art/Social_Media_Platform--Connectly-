import express from "express";
import {
  createCollection,
  getCollections,
  updateCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
  getCollectionPosts,
} from "../controller/collectionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = express.Router();

router.use(requireAuth);

router.get("/", getCollections);
router.post("/", createCollection);

router.get("/:collectionId/posts", getCollectionPosts);
router.post("/:collectionId/posts/:postId", addPostToCollection);
router.delete("/:collectionId/posts/:postId", removePostFromCollection);

router.patch("/:collectionId", updateCollection);
router.delete("/:collectionId", deleteCollection);

