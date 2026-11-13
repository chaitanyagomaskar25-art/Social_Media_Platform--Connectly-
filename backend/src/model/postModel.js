
import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2200,
      default: "",
    },
hashtags: {
  type: [String],
  default: [],
  index: true,
},
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },

    imagePublicId: {
      type: String,
      trim: true,
      default: "",
    },
    media: [{
      url: { type: String, required: true },
      publicId: { type: String, default: "" },
      type: { type: String, enum: ["image", "video"], required: true },
    }],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

export const Post = mongoose.model("Post", postSchema);
