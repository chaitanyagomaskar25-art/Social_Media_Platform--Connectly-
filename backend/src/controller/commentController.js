
import mongoose from "mongoose";
import { Comment } from "../model/Comment.js";
import { Post } from "../model/postModel.js";
import { createNotification, deleteNotification } from "../utils/createNotification.js";
import { User } from "../model/User.js";
import { canViewUserContent } from "../utils/canViewUserContent.js";
import { Notification } from "../model/Notification.js";
import { emitCommentAdded, emitCommentDeleted, emitCommentUpdated } from "../socket.js";

export const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const post = await Post.findById(postId).select("author").lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }
    if (!await canViewUserContent(req.user?._id, post.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const comments = await Comment.find({ post: postId })
      .populate("author", "name username avatarUrl")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments.",
    });
  }
};

export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;

    // Accept either frontend field, but store consistently as `text`.
    const text =
      typeof req.body.text === "string"
        ? req.body.text
        : req.body.content;
    const parentCommentId = req.body.parentCommentId || null;

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 1000 characters.",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }
    if (!await canViewUserContent(req.user?._id, post.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    let parentComment = null;
    if (parentCommentId) {
      if (!mongoose.isValidObjectId(parentCommentId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment ID.' });
      }
      parentComment = await Comment.findOne({ _id: parentCommentId, post: postId });
      if (!parentComment) {
        return res.status(404).json({ success: false, message: 'Parent comment not found.' });
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user._id,
      text: text.trim(),
      parentComment: parentComment?._id || null,
    });

    await comment.populate("author", "name username avatarUrl");

    await createNotification({
      recipient: parentComment?.author || post.author,
      sender: req.user._id,
      type: parentComment ? 'reply' : "comment",
      post: post._id,
      comment: comment._id,
    });

    if (parentComment && String(parentComment.author) !== String(post.author)) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });
    }

    const mentionedUsernames = [...new Set(
      [...text.matchAll(/(?:^|\s)@([a-zA-Z0-9_]{3,30})/g)].map((match) => match[1].toLowerCase())
    )];
    if (mentionedUsernames.length) {
      const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } }).select('_id');
      await Promise.all(mentionedUsers.map((mentionedUser) => createNotification({
        recipient: mentionedUser._id,
        sender: req.user._id,
        type: 'mention',
        post: post._id,
        comment: comment._id,
      })));
    }

    const commentCount = await Comment.countDocuments({ post: post._id });
    emitCommentAdded({
      postId: post._id,
      comment,
      commentCount,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to add comment.",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (
      !mongoose.isValidObjectId(commentId) ||
      (postId && !mongoose.isValidObjectId(postId))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid post or comment ID.",
      });
    }

    const filter = {
      _id: commentId,
      author: req.user._id,
    };

    if (postId) {
      filter.post = postId;
    }

    // Only the comment author can delete it through this endpoint.
    const comment = await Comment.findOne(filter);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you are not allowed to delete it.",
      });
    }

    const commentIds = [comment._id];
    let parents = [comment._id];
    while (parents.length) {
      const children = await Comment.find({
        post: comment.post,
        parentComment: { $in: parents },
      }).select("_id").lean();
      parents = children
        .map(({ _id }) => _id)
        .filter((childId) => !commentIds.some((id) => id.equals(childId)));
      commentIds.push(...parents);
    }

    await Promise.all([
      Comment.deleteMany({ _id: { $in: commentIds }, post: comment.post }),
      Notification.deleteMany({ comment: { $in: commentIds } }),
    ]);

    const post = await Post.findById(comment.post).select('author');
    if (post) {
      await deleteNotification({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        post: post._id,
        comment: comment._id,
      });
    }

    const commentCount = await Comment.countDocuments({ post: comment.post });
    emitCommentDeleted({
      postId: comment.post,
      commentId: comment._id,
      commentIds,
      commentCount,
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
      commentId: comment._id,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
    });
  }
};



export const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    if (
      !mongoose.isValidObjectId(commentId) ||
      (postId && !mongoose.isValidObjectId(postId))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid post or comment ID.',
      });
    }

    const text =
      typeof req.body.text === 'string'
        ? req.body.text
        : req.body.content;

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty.',
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.',
      });
    }

    const filter = {
      _id: commentId,
      author: req.user._id,
    };

    if (postId) {
      filter.post = postId;
    }

    const comment = await Comment.findOne(filter);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found or you are not allowed to edit it.',
      });
    }

    const EDIT_WINDOW_MS = 15 * 60 * 1000;
    const elapsed = Date.now() - comment.createdAt.getTime();

    if (elapsed > EDIT_WINDOW_MS) {
      return res.status(403).json({
        success: false,
        message: 'The editing deadline has passed.',
      });
    }

    comment.text = text.trim();
    await comment.save();

    await comment.populate(
      'author',
      'name username avatarUrl'
    );

    emitCommentUpdated({
      postId: comment.post,
      comment,
    });

    return res.status(200).json({
      success: true,
      message: 'Comment updated successfully.',
      comment,
    });
  } catch (error) {
    console.error('Update comment error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update comment.',
    });
  }
};
