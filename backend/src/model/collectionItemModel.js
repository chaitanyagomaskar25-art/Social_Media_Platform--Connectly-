
import mongoose from "mongoose";

const collectionItemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },  
  },
  { timestamps: true }
);


collectionItemSchema.index(
  { user: 1, collectionId: 1, post: 1 },
  { unique: true }
);

collectionItemSchema.index({ user: 1, collectionId: 1, createdAt: -1 });

export const CollectionItem =
  mongoose.models.CollectionItem ||
  mongoose.model("CollectionItem", collectionItemSchema);
