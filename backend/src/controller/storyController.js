import mongoose from "mongoose";
import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";
import { Story } from "../model/Story.js";
import {
  emitStoryCreated,
  emitStoryViewed,
  emitStoryDeleted,
  emitStoryUpdated,
} from "../socket.js";

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;
const STORY_EDIT_WINDOW_MS = 30 * 60 * 1000;
const MAX_STORIES_PER_RESPONSE = 500;
const authorFields = "name username avatarUrl privateAccount followers blockedUsers";

const idString = (value) => String(value?._id ?? value);

const canViewStories = (author, viewer) => {
  if (!author || !viewer) return false;
  if (idString(author) === idString(viewer)) return true;

  const viewerId = idString(viewer);
  const authorId = idString(author);
  const viewerBlocked = (viewer.blockedUsers || []).some(
    (userId) => idString(userId) === authorId
  );
  const authorBlocked = (author.blockedUsers || []).some(
    (userId) => idString(userId) === viewerId
  );
  const followsPrivateAuthor = (author.followers || []).some(
    (userId) => idString(userId) === viewerId
  );

  return !viewerBlocked && !authorBlocked &&
    (!author.privateAccount || followsPrivateAuthor);
};

const mediaMatchesType = (buffer, mimetype) => {
  if (mimetype === "image/jpeg") {
    return buffer.length >= 3 &&
      buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimetype === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }
  if (mimetype === "image/webp") {
    return buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";
  }
  if (mimetype === "video/mp4" || mimetype === "video/quicktime") {
    return buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp";
  }
  if (mimetype === "video/webm") {
    return buffer.length >= 4 &&
      buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  }
  return false;
};

const uploadToCloudinary = (buffer, mediaType) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "connectly/stories",
        resource_type: mediaType,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    Readable.from([buffer]).pipe(stream);
  });

const removeCloudinaryAsset = async (publicId, mediaType) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: mediaType });
  } catch (error) {
    console.error("Could not clean up failed story media upload:", error.message);
  }
};

const serializeStory = (story, viewerId) => ({
  id: String(story._id),
  mediaUrl: story.mediaUrl,
  mediaType: story.mediaType,
  caption: story.caption || "",
  createdAt: story.createdAt,
  expiresAt: story.expiresAt,
  viewed: (story.viewers || []).some((id) => idString(id) === idString(viewerId)),
  viewersCount: (story.viewers || []).length,
});

export const createStory = async (req, res) => {
  let uploadedAsset;
  let createdStory;
  let mediaType;

  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "A story image or video is required in the 'media' field.",
      });
    }

    if (!mediaMatchesType(file.buffer, file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "The uploaded file content does not match its media type.",
      });
    }

    mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
    uploadedAsset = await uploadToCloudinary(file.buffer, mediaType);

    const caption = req.body?.caption ? String(req.body.caption).trim().slice(0, 500) : "";
    const now = new Date();
    createdStory = await Story.create({
      author: req.user._id,
      mediaUrl: uploadedAsset.secure_url,
      mediaPublicId: uploadedAsset.public_id,
      mediaType,
      caption,
      createdAt: now,
      expiresAt: new Date(now.getTime() + STORY_LIFETIME_MS),
    });

    await createdStory.populate("author", "name username avatarUrl");

    const serializedStory = {
      ...serializeStory(createdStory, req.user._id),
      mediaPublicId: createdStory.mediaPublicId,
      author: createdStory.author,
    };

    emitStoryCreated({
      story: serializedStory,
      author: createdStory.author,
    });

    return res.status(201).json({
      success: true,
      story: serializedStory,
    });
  } catch (error) {
    if (createdStory?._id) {
      try {
        await Story.deleteOne({ _id: createdStory._id });
      } catch (cleanupError) {
        console.error("Could not remove failed story record:", cleanupError.message);
      }
    }
    await removeCloudinaryAsset(uploadedAsset?.public_id, mediaType);
    console.error("Create story error:", error);
    return res.status(500).json({
      success: false,
      message: uploadedAsset
        ? "The story could not be saved."
        : "Story media upload failed. Check the Cloudinary configuration.",
    });
  }
};

export const listStories = async (req, res) => {
  try {
    const now = new Date();

    // Automatically delete stories older than 24 hours
    await Story.deleteMany({ expiresAt: { $lte: now } }).catch((cleanupErr) => {
      console.warn("Story 24h auto-delete notice:", cleanupErr.message);
    });

    const stories = await Story.find({ expiresAt: { $gt: now } })
      .sort({ createdAt: 1, _id: 1 })
      .limit(MAX_STORIES_PER_RESPONSE + 1)
      .populate("author", authorFields)
      .lean();

    const grouped = new Map();
    for (const story of stories.slice(0, MAX_STORIES_PER_RESPONSE)) {
      if (!canViewStories(story.author, req.user)) continue;

      const authorId = String(story.author._id);
      if (!grouped.has(authorId)) {
        grouped.set(authorId, {
          author: {
            id: authorId,
            name: story.author.name,
            username: story.author.username,
            avatarUrl: story.author.avatarUrl,
          },
          stories: [],
          hasUnviewed: false,
        });
      }

      const responseStory = serializeStory(story, req.user._id);
      const group = grouped.get(authorId);
      group.stories.push(responseStory);
      if (!responseStory.viewed) group.hasUnviewed = true;
    }

    const groups = [...grouped.values()].sort((first, second) => {
      if (first.author.id === String(req.user._id)) return -1;
      if (second.author.id === String(req.user._id)) return 1;
      return new Date(second.stories.at(-1).createdAt) -
        new Date(first.stories.at(-1).createdAt);
    });

    return res.status(200).json({
      success: true,
      stories: groups,
      truncated: stories.length > MAX_STORIES_PER_RESPONSE,
    });
  } catch (error) {
    console.error("List stories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stories.",
    });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID.",
      });
    }

    const now = new Date();
    const story = await Story.findOne({ _id: id, expiresAt: { $gt: now } })
      .populate("author", authorFields);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found or expired.",
      });
    }

    if (!canViewStories(story.author, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view this story.",
      });
    }

    if (idString(story.author) === idString(req.user._id)) {
      return res.status(200).json({
        success: true,
        story: serializeStory(story, req.user._id),
        viewed: false,
        alreadyViewed: false,
      });
    }

    const updatedStory = await Story.findOneAndUpdate(
      {
        _id: id,
        expiresAt: { $gt: now },
        viewers: { $ne: req.user._id },
      },
      { $addToSet: { viewers: req.user._id } },
      { returnDocument: 'after' }
    ).populate("author", "name username avatarUrl");

    if (updatedStory) {
      emitStoryViewed({
        storyId: updatedStory._id,
        authorId: updatedStory.author?._id || updatedStory.author,
        viewerId: req.user._id,
        viewer: {
          _id: req.user._id,
          id: String(req.user._id),
          name: req.user.name,
          username: req.user.username,
          avatarUrl: req.user.avatarUrl,
        },
        viewersCount: (updatedStory.viewers || []).length,
      });

      return res.status(200).json({
        success: true,
        story: serializeStory(updatedStory, req.user._id),
        viewed: true,
        alreadyViewed: false,
      });
    }

    const existingStory = await Story.findOne({
      _id: id,
      expiresAt: { $gt: new Date() },
    })
      .select("mediaUrl mediaType createdAt expiresAt viewers author")
      .populate("author", "name username avatarUrl");

    if (!existingStory) {
      return res.status(404).json({
        success: false,
        message: "Story not found or expired.",
      });
    }

    return res.status(200).json({
      success: true,
      story: serializeStory(existingStory, req.user._id),
      viewed: true,
      alreadyViewed: true,
    });
  } catch (error) {
    console.error("View story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to record story view.",
    });
  }
};

export const updateStory = async (req, res) => {
  let uploadedAsset;
  let mediaType;

  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID.",
      });
    }

    const story = await Story.findOne({ _id: id, author: req.user._id });
    if (!story) {
      const exists = await Story.exists({ _id: id });
      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to edit this story."
          : "Story not found.",
      });
    }

    const timeSinceCreation = Date.now() - new Date(story.createdAt).getTime();
    if (timeSinceCreation > STORY_EDIT_WINDOW_MS) {
      return res.status(400).json({
        success: false,
        message: "Stories can only be edited within 30 minutes of being shared.",
      });
    }

    const file = req.file;
    const oldPublicId = story.mediaPublicId;
    const oldMediaType = story.mediaType;

    if (file) {
      if (!mediaMatchesType(file.buffer, file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "The uploaded file content does not match its media type.",
        });
      }
      mediaType = file.mimetype.startsWith("image/") ? "image" : "video";
      uploadedAsset = await uploadToCloudinary(file.buffer, mediaType);
      story.mediaUrl = uploadedAsset.secure_url;
      story.mediaPublicId = uploadedAsset.public_id;
      story.mediaType = mediaType;
    }

    if (req.body?.caption !== undefined) {
      story.caption = String(req.body.caption).trim().slice(0, 500);
    }

    await story.save();
    await story.populate("author", "name username avatarUrl");

    if (uploadedAsset && oldPublicId) {
      await removeCloudinaryAsset(oldPublicId, oldMediaType);
    }

    const serialized = {
      ...serializeStory(story, req.user._id),
      mediaPublicId: story.mediaPublicId,
      author: story.author,
    };

    emitStoryUpdated({
      story: serialized,
      author: story.author,
    });

    return res.status(200).json({
      success: true,
      message: "Story updated successfully.",
      story: serialized,
    });
  } catch (error) {
    if (uploadedAsset?.public_id) {
      await removeCloudinaryAsset(uploadedAsset.public_id, mediaType);
    }
    console.error("Update story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update story.",
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID.",
      });
    }

    const story = await Story.findOne({ _id: id, author: req.user._id });
    if (!story) {
      const exists = await Story.exists({ _id: id });
      return res.status(exists ? 403 : 404).json({
        success: false,
        message: exists
          ? "You are not authorized to delete this story."
          : "Story not found.",
      });
    }

    await Story.deleteOne({ _id: id });
    await removeCloudinaryAsset(story.mediaPublicId, story.mediaType);

    emitStoryDeleted({
      storyId: id,
      authorId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Story deleted successfully.",
      storyId: id,
    });
  } catch (error) {
    console.error("Delete story error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete story.",
    });
  }
};

export const getStoryViewers = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID.",
      });
    }

    const story = await Story.findById(id).populate(
      "viewers",
      "name username avatarUrl bio"
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    // Only the user who created this story is allowed to view its viewers
    if (idString(story.author) !== idString(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Only the user who created this story can view its viewers.",
      });
    }

    return res.status(200).json({
      success: true,
      viewersCount: (story.viewers || []).length,
      viewers: (story.viewers || []).map((viewer) => ({
        _id: String(viewer._id),
        id: String(viewer._id),
        name: viewer.name,
        username: viewer.username,
        avatarUrl: viewer.avatarUrl,
        bio: viewer.bio || "",
      })),
    });
  } catch (error) {
    console.error("Get story viewers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch story viewers.",
    });
  }
};
