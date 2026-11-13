
import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

// A user can bookmark a post only once.
savedPostSchema.index({ user: 1, post: 1 }, { unique: true });
savedPostSchema.index({ user: 1, createdAt: -1 });

export const SavedPost =
  mongoose.models.SavedPost ||
  mongoose.model("SavedPost", savedPostSchema);
