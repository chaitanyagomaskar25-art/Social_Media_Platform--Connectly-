
import mongoose from "mongoose";
import { SavedPost } from "../model/savedPostModel.js";
import { CollectionItem } from "../model/collectionItemModel.js";
import { Post } from "../model/postModel.js";
import { enrichPostResponses } from "../utils/enrichPostResponses.js";
import { canViewUserContent } from "../utils/canViewUserContent.js";
import { emitSavedPostUpdated } from "../socket.js";

const authorFields = "name username avatarUrl";

const isValidId = (id) => mongoose.isValidObjectId(id);

// POST /api/saved-posts/:postId
export const savePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;

    if (!isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const postExists = await Post.findById(postId).select("author").lean();

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }
    if (!await canViewUserContent(userId, postExists.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const savedPost = await SavedPost.findOneAndUpdate(
      { user: userId, post: postId },
      { $setOnInsert: { user: userId, post: postId } },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      }
    );

    emitSavedPostUpdated(userId, { postId, isSaved: true });

    return res.status(200).json({
      success: true,
      message: "Post saved successfully.",
      savedPost,
    });
  } catch (error) {
    // Concurrent duplicate bookmark requests are harmless.
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Post is already saved.",
      });
    }

    console.error("Save post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save post.",
    });
  }
};

// DELETE /api/saved-posts/:postId
export const unsavePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { postId } = req.params;

    if (!isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    await SavedPost.deleteOne({
      user: userId,
      post: postId,
    });

    // Remove the post from this user's collections as well.
    await CollectionItem.deleteMany({
      user: userId,
      post: postId,
    });

    emitSavedPostUpdated(userId, { postId, isSaved: false });

    return res.status(200).json({
      success: true,
      message: "Post removed from saved posts and collections.",
    });
  } catch (error) {
    console.error("Unsave post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove saved post.",
    });
  }
};

// GET /api/saved-posts
export const getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 12)
    );

    const filter = { user: userId };

    const [total, records] = await Promise.all([
      SavedPost.countDocuments(filter),

      SavedPost.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: "post",
          populate: {
            path: "author",
            select: authorFields,
          },
        })
        .lean(),
    ]);

    const posts = records
      .filter((record) => record.post)
      .map((record) => ({
        ...record.post,
        savedAt: record.createdAt,
        savedPostId: record._id,
      }));
    const visiblePosts = await Promise.all(posts.map(async (post) =>
      await canViewUserContent(userId, post.author?._id || post.author) ? post : null
    ));
    const enrichedPosts = await enrichPostResponses(visiblePosts.filter(Boolean), userId);

    return res.status(200).json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get saved posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved posts.",
    });
  }
};

// GET /api/saved-posts/:postId/status
export const getSavedPostStatus = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const saved = await SavedPost.exists({
      user: req.user._id,
      post: postId,
    });

    return res.status(200).json({
      success: true,
      isSaved: Boolean(saved),
    });
  } catch (error) {
    console.error("Get saved post status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check saved post status.",
    });
  }
};
