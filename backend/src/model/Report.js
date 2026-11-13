import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["post", "comment", "user"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["open", "reviewed", "actioned", "dismissed"],
      default: "open",
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    actionedAt: {
      type: Date,
      default: null,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "open" },
  }
);
reportSchema.index({ status: 1, createdAt: -1 });

export const Report =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
