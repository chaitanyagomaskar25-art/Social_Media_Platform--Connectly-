import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mediaUrl: {
      type: String,
      required: true,
      trim: true,
    },
    mediaPublicId: {
      type: String,
      required: true,
      trim: true,
    },
    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    viewers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

storySchema.index({ author: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story =
  mongoose.models.Story || mongoose.model("Story", storySchema);
