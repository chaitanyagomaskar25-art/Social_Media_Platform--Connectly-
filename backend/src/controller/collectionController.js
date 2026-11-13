
import mongoose from "mongoose";
import { Collection } from "../model/collectionModel.js";
import { CollectionItem } from "../model/collectionItemModel.js";
import { SavedPost } from "../model/savedPostModel.js";
import { Post } from "../model/postModel.js";
import { enrichPostResponses } from "../utils/enrichPostResponses.js";
import { canViewUserContent } from "../utils/canViewUserContent.js";

const authorFields = "name username avatarUrl";

const isValidId = (id) => mongoose.isValidObjectId(id);

// POST /api/collections
export const createCollection = async (req, res) => {
  try {
    const name =
      typeof req.body.name === "string" ? req.body.name.trim() : "";

    const description =
      typeof req.body.description === "string"
        ? req.body.description.trim()
        : "";

    if (!name || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Collection name must be between 1 and 50 characters.",
      });
    }

    if (description.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Description cannot exceed 200 characters.",
      });
    }

    const collection = await Collection.create({
      user: req.user._id,
      name,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully.",
      collection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A collection with this name already exists.",
      });
    }

    console.error("Create collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create collection.",
    });
  }
};

// GET /api/collections
export const getCollections = async (req, res) => {
  try {
    const userId = req.user._id;

    const collections = await Collection.find({ user: userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Count items belonging to each collection.
    const counts = await CollectionItem.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$collectionId",
          postCount: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      counts.map((item) => [item._id.toString(), item.postCount])
    );

    const result = collections.map((collection) => ({
      ...collection,
      postCount: countMap.get(collection._id.toString()) || 0,
    }));

    return res.status(200).json({
      success: true,
      collections: result,
    });
  } catch (error) {
    console.error("Get collections error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch collections.",
    });
  }
};

// PATCH /api/collections/:collectionId
export const updateCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    if (!isValidId(collectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string") {
        return res.status(400).json({
          success: false,
          message: "Collection name must be text.",
        });
      }

      const name = req.body.name.trim();

      if (!name || name.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Collection name must be between 1 and 50 characters.",
        });
      }

      updates.name = name;
    }

    if (req.body.description !== undefined) {
      if (typeof req.body.description !== "string") {
        return res.status(400).json({
          success: false,
          message: "Description must be text.",
        });
      }

      const description = req.body.description.trim();

      if (description.length > 200) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 200 characters.",
        });
      }

      updates.description = description;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a name or description to update.",
      });
    }

    const collection = await Collection.findOneAndUpdate(
      { _id: collectionId, user: req.user._id },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully.",
      collection,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A collection with this name already exists.",
      });
    }

    console.error("Update collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update collection.",
    });
  }
};

// DELETE /api/collections/:collectionId
export const deleteCollection = async (req, res) => {
  try {
    const { collectionId } = req.params;

    if (!isValidId(collectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const collection = await Collection.findOneAndDelete({
      _id: collectionId,
      user: req.user._id,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    await CollectionItem.deleteMany({
      collectionId: collection._id,
      user: req.user._id,
    });

    // Deleting a collection does not remove bookmarks.
    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully. Saved posts are unchanged.",
    });
  } catch (error) {
    console.error("Delete collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete collection.",
    });
  }
};

// POST /api/collections/:collectionId/posts/:postId
export const addPostToCollection = async (req, res) => {
  try {
    const { collectionId, postId } = req.params;
    const userId = req.user._id;

    if (!isValidId(collectionId) || !isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection or post ID.",
      });
    }

    const [collection, post] = await Promise.all([
      Collection.exists({ _id: collectionId, user: userId }),
      Post.findById(postId).select("author").lean(),
    ]);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }
    if (!await canViewUserContent(userId, post.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const saved = await SavedPost.exists({
      user: userId,
      post: postId,
    });

    if (!saved) {
      return res.status(400).json({
        success: false,
        message: "Save the post before adding it to a collection.",
      });
    }

    await CollectionItem.updateOne(
      {
        user: userId,
        collectionId,
        post: postId,
      },
      {
        $setOnInsert: {
          user: userId,
          collectionId,
          post: postId,
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Post added to collection successfully.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        message: "Post is already in this collection.",
      });
    }

    console.error("Add post to collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add post to collection.",
    });
  }
};

// DELETE /api/collections/:collectionId/posts/:postId
export const removePostFromCollection = async (req, res) => {
  try {
    const { collectionId, postId } = req.params;
    const userId = req.user._id;

    if (!isValidId(collectionId) || !isValidId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection or post ID.",
      });
    }

    const collection = await Collection.exists({
      _id: collectionId,
      user: userId,
    });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    await CollectionItem.deleteOne({
      user: userId,
      collectionId,
      post: postId,
    });

    // The post stays in Saved Posts.
    return res.status(200).json({
      success: true,
      message: "Post removed from collection.",
    });
  } catch (error) {
    console.error("Remove post from collection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove post from collection.",
    });
  }
};

// GET /api/collections/:collectionId/posts
export const getCollectionPosts = async (req, res) => {
  try {
    const { collectionId } = req.params;
    const userId = req.user._id;

    if (!isValidId(collectionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID.",
      });
    }

    const collection = await Collection.findOne({
      _id: collectionId,
      user: userId,
    }).lean();

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found.",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 12)
    );

    const filter = {
      user: userId,
      collectionId,
    };

    const [total, items] = await Promise.all([
      CollectionItem.countDocuments(filter),

      CollectionItem.find(filter)
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

    const posts = items
      .filter((item) => item.post)
      .map((item) => ({
        ...item.post,
        addedToCollectionAt: item.createdAt,
      }));

    const visiblePosts = await Promise.all(posts.map(async (post) =>
      await canViewUserContent(userId, post.author?._id || post.author) ? post : null
    ));
    const enrichedPosts = await enrichPostResponses(visiblePosts.filter(Boolean), userId);

    return res.status(200).json({
      success: true,
      collection,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get collection posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch collection posts.",
    });
  }
};
