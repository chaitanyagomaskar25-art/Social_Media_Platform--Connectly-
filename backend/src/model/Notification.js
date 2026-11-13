
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['follow', 'like', 'comment', 'mention', 'reply'],
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Efficiently fetch notifications for a user, newest first.
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Avoid duplicate index declarations.
export const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
