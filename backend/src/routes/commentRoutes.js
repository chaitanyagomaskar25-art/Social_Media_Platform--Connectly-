
import { Router } from "express";
import {
  getComments,
  addComment,
  deleteComment,
    updateComment,

} from "../controller/commentController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

export const router = Router({ mergeParams: true });

router.get("/", getComments);
router.post("/", requireAuth, addComment);
router.delete("/:commentId", requireAuth, deleteComment);
router.put('/:commentId', requireAuth, updateComment);
