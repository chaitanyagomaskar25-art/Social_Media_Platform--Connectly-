
import mongoose from "mongoose";
import { Post } from "../model/postModel.js";
import { User } from "../model/User.js";
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'node:stream';
import { createNotification, deleteNotification } from '../utils/createNotification.js';
import { enrichPostResponses } from '../utils/enrichPostResponses.js';
import { canViewUserContent, getVisibleAuthorIds } from '../utils/canViewUserContent.js';
import { Comment } from '../model/Comment.js';
import { SavedPost } from '../model/savedPostModel.js';
import { CollectionItem } from '../model/collectionItemModel.js';
import { Notification } from '../model/Notification.js';
import { emitPostLiked, emitPostCreated, emitPostDeleted, emitPostUpdated } from '../socket.js';

const publicAuthorFields = "name username avatarUrl";


const extractHashtags = (caption = "") => {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu) || [];

  return [
    ...new Set(
      matches.map((tag) => tag.slice(1).toLowerCase())
    ),
  ].slice(0, 30);
};


const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'connectly/posts',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

const uploadMediaToCloudinary = (file) => new Promise((resolve, reject) => {
  const isVideo = file.mimetype.startsWith('video/');
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'connectly/posts',
      resource_type: isVideo ? 'video' : 'image',
    },
    (error, result) => {
      if (error) reject(error);
      else resolve({
        url: result.secure_url,
        publicId: result.public_id,
        type: isVideo ? 'video' : 'image',
      });
    }
  );
  Readable.from(file.buffer).pipe(stream);
});

const getUploadedMedia = (req) => [
  ...(req.files?.images || []),
  ...(req.files?.image || []),
  ...(req.files?.video || []),
];

export const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const visibleAuthors = await getVisibleAuthorIds(req.user?._id);
    const feedFilter = { author: { $in: visibleAuthors } };
    const [posts, total] = await Promise.all([
      Post.find(feedFilter)
        .populate("author", publicAuthorFields)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Post.countDocuments(feedFilter),
    ]);

    const currentUserId = req.user?._id;

    return res.status(200).json({
      success: true,
      posts: await enrichPostResponses(posts, currentUserId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch feed.",
    });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const post = await Post.findById(id)
      .populate("author", publicAuthorFields)
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    if (!await canViewUserContent(req.user?._id, post.author?._id || post.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    return res.status(200).json({
      success: true,
      post: (await enrichPostResponses([post], req.user?._id))[0],
    });
  } catch (error) {
    console.error("Get post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch post.",
    });
  }
};

export const createPost = async (req, res, next) => {
  const uploadedMedia = [];

  try {
    const authorId = req.user?._id;
    const caption = String(req.body.caption ?? '').trim();
    const files = getUploadedMedia(req);
    const videoFiles = files.filter((file) => file.mimetype.startsWith('video/'));

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (files.length > 10 || videoFiles.length > 1 || (videoFiles.length && files.length > 1)) {
      return res.status(400).json({
        success: false,
        message: 'A post can include up to 10 photos or one short video.',
      });
    }

    if (!caption && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A caption or image is required.',
      });
    }

    if (caption.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Caption cannot exceed 2000 characters.',
      });
    }

    for (const file of files) {
      const maxSize = file.mimetype.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: file.mimetype.startsWith('video/')
            ? 'Videos must be 50 MB or smaller.'
            : 'Each image must be 5 MB or smaller.',
        });
      }
      uploadedMedia.push(await uploadMediaToCloudinary(file));
    }

    const postData = {
      author: authorId,
      caption,
      hashtags: extractHashtags(caption),
      media: uploadedMedia,
      imageUrl: uploadedMedia.find((media) => media.type === 'image')?.url || '',
      imagePublicId: uploadedMedia.find((media) => media.type === 'image')?.publicId || '',
    };

    const post = await Post.create(postData);

    await post.populate({
      path: 'author',
      select: 'name username avatarUrl',
    });

    const postResponse = {
      ...post.toObject(),
      likesCount: post.likes?.length ?? 0,
      commentCount: 0,
      isLiked: false,
    };

    emitPostCreated({ post: postResponse });

    return res.status(201).json({
      success: true,
      message: 'Post created successfully.',
      post: postResponse,
    });
  } catch (error) {
    // If Cloudinary succeeded but database creation failed,
    // attempt to remove the orphaned image.
    for (const media of uploadedMedia) {
      try {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.type === 'video' ? 'video' : 'image',
        });
      } catch (cleanupError) {
        console.error('Cloudinary cleanup failed:', cleanupError);
      }
    }

    next(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const target = await Post.findById(id).select("author").lean();
    if (!target || !await canViewUserContent(req.user._id, target.author)) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    const alreadyLiked = await Post.exists({ _id: id, likes: req.user._id });

    // $addToSet prevents duplicate likes from the same user.
    const post = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likes: req.user._id } },
      { returnDocument: 'after', runValidators: true }
    ).populate("author", publicAuthorFields);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    if (!alreadyLiked) {
      await createNotification({
        recipient: post.author._id,
        sender: req.user._id,
        type: 'like',
        post: post._id,
      });
    }

    emitPostLiked({
      postId: post._id,
      likesCount: post.likes.length,
      userId: req.user._id,
      action: "like",
    });

    return res.status(200).json({
      success: true,
      message: "Post liked successfully.",
      post: (await enrichPostResponses([post], req.user._id))[0],
    });
  } catch (error) {
    console.error("Like post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to like post.",
    });
  }
};

export const unlikePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      { $pull: { likes: req.user._id } },
      { returnDocument: 'after', runValidators: true }
    ).populate("author", publicAuthorFields);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    await deleteNotification({
      recipient: post.author._id,
      sender: req.user._id,
      type: 'like',
      post: post._id,
    });

    emitPostLiked({
      postId: post._id,
      likesCount: post.likes.length,
      userId: req.user._id,
      action: "unlike",
    });

    return res.status(200).json({
      success: true,
      message: "Post unliked successfully.",
      post: (await enrichPostResponses([post], req.user._id))[0],
    });
  } catch (error) {
    console.error("Unlike post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unlike post.",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    // Only the post's author can delete it.
    const post = await Post.findOneAndDelete({
      _id: id,
      author: req.user._id,
    });

    if (!post) {
      const exists = await Post.exists({ _id: id });

      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not allowed to delete this post."
          : "Post not found.",
      });
    }

    const cleanupTasks = [
      Comment.deleteMany({ post: post._id }),
      SavedPost.deleteMany({ post: post._id }),
      CollectionItem.deleteMany({ post: post._id }),
      Notification.deleteMany({ post: post._id }),
    ];

    const mediaAssets = new Map();
    if (post.imagePublicId) {
      mediaAssets.set(post.imagePublicId, 'image');
    }
    for (const media of post.media || []) {
      if (media.publicId) {
        mediaAssets.set(media.publicId, media.type === 'video' ? 'video' : 'image');
      }
    }
    for (const [publicId, type] of mediaAssets) {
      cleanupTasks.push(
        cloudinary.uploader.destroy(publicId, { resource_type: type })
      );
    }

    const cleanupResults = await Promise.allSettled(cleanupTasks);
    for (const result of cleanupResults) {
      if (result.status === 'rejected') {
        console.error('Post deletion cleanup failed:', result.reason);
      }
    }

    emitPostDeleted({ postId: post._id });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
      postId: post._id,
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete post.",
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const userExists = await User.exists({ _id: userId });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!await canViewUserContent(req.user?._id, userId)) {
      return res.status(200).json({ success: true, count: 0, posts: [] });
    }

    const posts = await Post.find({ author: userId })
      .populate("author", publicAuthorFields)
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: posts.length,
      posts: await enrichPostResponses(posts, req.user?._id),
    });
  } catch (error) {
    console.error("Get user posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user posts.",
    });
  }
};





const POST_EDIT_WINDOW_MS = 15 * 60 * 1000;

export const updatePost = async (req, res, next) => {
  const uploadedMedia = [];

  try {
    const { id } = req.params;
    const authorId = req.user?._id;

    if (!authorId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    // Only the author can edit their post.
    const existingPost = await Post.findOne({
      _id: id,
      author: authorId,
    });

    if (!existingPost) {
      const postExists = await Post.exists({ _id: id });

      return res.status(postExists ? 403 : 404).json({
        success: false,
        message: postExists
          ? "You are not allowed to edit this post."
          : "Post not found.",
      });
    }

    const deadline =
      existingPost.createdAt.getTime() + POST_EDIT_WINDOW_MS;

    if (Date.now() > deadline) {
      return res.status(403).json({
        success: false,
        message: "The 15-minute post editing window has expired.",
      });
    }

    // Keep the existing caption if caption wasn't provided.
    const captionProvided = req.body.caption !== undefined;
    const caption = captionProvided
      ? String(req.body.caption).trim()
      : existingPost.caption;

    if (caption.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Caption cannot exceed 2000 characters.",
      });
    }

    const removeImage =
      String(req.body.removeImage).toLowerCase() === "true";

    // Upload a replacement image, if provided.
    const files = getUploadedMedia(req);
    const videos = files.filter((file) => file.mimetype.startsWith('video/'));
    if (files.length > 10 || videos.length > 1 || (videos.length && files.length > 1)) {
      return res.status(400).json({ success: false, message: 'A post can include up to 10 photos or one short video.' });
    }
    for (const file of files) {
      const maxSize = file.mimetype.startsWith('video/') ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ success: false, message: file.mimetype.startsWith('video/') ? 'Videos must be 50 MB or smaller.' : 'Each image must be 5 MB or smaller.' });
      }
      uploadedMedia.push(await uploadMediaToCloudinary(file));
    }

    const nextMedia = uploadedMedia.length
      ? uploadedMedia
      : removeImage ? [] : existingPost.media || [];
    const nextImageUrl = nextMedia.find((media) => media.type === 'image')?.url || "";

    const nextImagePublicId = nextMedia.find((media) => media.type === 'image')?.publicId || "";

    if (!caption && !nextImageUrl) {
      if (uploadedImage?.public_id) {
        await cloudinary.uploader.destroy(uploadedImage.public_id);
        uploadedImage = null;
      }

      return res.status(400).json({
        success: false,
        message: "A post must contain a caption or an image.",
      });
    }

    // Update only if the author and deadline still match.
    const updatedPost = await Post.findOneAndUpdate(
      {
        _id: id,
        author: authorId,
        createdAt: { $gte: new Date(Date.now() - POST_EDIT_WINDOW_MS) },
      },
      {
        $set: {
          caption,
            hashtags: extractHashtags(caption),

          imageUrl: nextImageUrl,
          imagePublicId: nextImagePublicId,
          media: nextMedia,
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).populate("author", publicAuthorFields);

    if (!updatedPost) {
      for (const media of uploadedMedia) {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.type === 'video' ? 'video' : 'image',
        });
      }

      return res.status(403).json({
        success: false,
        message: "The editing window has expired or the post can no longer be edited.",
      });
    }

    // The database update succeeded. Clean up the old image afterward.
    const newPublicIds = new Set((updatedPost.media || []).map((media) => media.publicId));
    for (const media of existingPost.media || []) {
      if (media.publicId && !newPublicIds.has(media.publicId)) {
        try {
          await cloudinary.uploader.destroy(media.publicId, {
            resource_type: media.type === 'video' ? 'video' : 'image',
          });
        } catch (cleanupError) {
          console.error("Old Cloudinary media cleanup failed:", cleanupError);
        }
      }
    }

    const enriched = (await enrichPostResponses([updatedPost], authorId))[0];
    emitPostUpdated({ post: enriched });

    return res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      post: enriched,
    });
  } catch (error) {
    // Remove a newly uploaded image if the update failed.
    for (const media of uploadedMedia) {
      try {
        await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.type === 'video' ? 'video' : 'image',
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup failed:", cleanupError);
      }
    }

    next(error);
  }
};


const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchPosts = async (req, res) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const hashtag = String(req.query.hashtag ?? "")
      .trim()
      .replace(/^#/, "")
      .toLowerCase();

    const sort = req.query.sort === "popular" ? "popular" : "newest";
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 12)
    );

    if (q.length > 100 || hashtag.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Search query is too long.",
      });
    }

    const filter = {};
    filter.author = { $in: await getVisibleAuthorIds(req.user?._id) };

    if (q) {
      filter.caption = {
        $regex: escapeRegex(q),
        $options: "i",
      };
    }

    if (hashtag) {
      filter.hashtags = hashtag;
    }

    const [total, posts] = await Promise.all([
      Post.countDocuments(filter),

      sort === "popular"
        ? Post.aggregate([
            { $match: filter },
            {
              $addFields: {
                likesCount: { $size: { $ifNull: ["$likes", []] } },
              },
            },
            { $sort: { likesCount: -1, createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
          ]).then((results) =>
            Post.populate(results, {
              path: "author",
              select: publicAuthorFields,
            })
          )
        : Post.find(filter)
            .populate("author", publicAuthorFields)
            .sort({ createdAt: -1, _id: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
    ]);

    const currentUserId = req.user?._id;

    return res.status(200).json({
      success: true,
      posts: await enrichPostResponses(posts, currentUserId),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Search posts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search posts.",
    });
  }
};

export const getTrendingHashtags = async (req, res) => {
  try {
    const days = Math.min(
      30,
      Math.max(1, parseInt(req.query.days, 10) || 7)
    );

    const limit = Math.min(
      20,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    );

    const hashtags = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          "hashtags.0": { $exists: true },
        },
      },
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          postCount: { $sum: 1 },
        },
      },
      { $sort: { postCount: -1, _id: 1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          hashtag: "$_id",
          postCount: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      periodDays: days,
      hashtags,
    });
  } catch (error) {
    console.error("Trending hashtags error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending hashtags.",
    });
  }
};
