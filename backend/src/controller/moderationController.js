import mongoose from "mongoose";
import { Comment } from "../model/Comment.js";
import { Post } from "../model/postModel.js";
import { Report } from "../model/Report.js";
import { User } from "../model/User.js";
import { FollowRequest } from "../model/FollowRequest.js";
import { recordFollowerSnapshot } from "../utils/recordFollowerSnapshot.js";

const targetModels = {
  post: Post,
  comment: Comment,
  user: User,
};

const isValidId = (id) => mongoose.isValidObjectId(id);

export const blockUser = async (req, res) => {
  const { userId } = req.params;

  if (!isValidId(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }
  if (new mongoose.Types.ObjectId(userId).equals(req.user._id)) {
    return res.status(400).json({ success: false, message: "You cannot block yourself." });
  }

  try {
    const target = await User.findById(userId).select("_id");
    if (!target) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    await Promise.all([
      User.updateOne(
        { _id: req.user._id },
        { $addToSet: { blockedUsers: target._id }, $pull: { following: target._id } }
      ),
      User.updateOne(
        { _id: target._id },
        { $pull: { followers: req.user._id } }
      ),
      User.updateOne(
        { _id: target._id },
        { $pull: { following: req.user._id } }
      ),
      User.updateOne(
        { _id: req.user._id },
        { $pull: { followers: target._id } }
      ),
      FollowRequest.updateMany(
        {
          $or: [
            { requester: req.user._id, recipient: target._id },
            { requester: target._id, recipient: req.user._id },
          ],
          status: "pending",
        },
        { $set: { status: "declined" } }
      ),
    ]);
    await Promise.all([
      recordFollowerSnapshot(req.user._id),
      recordFollowerSnapshot(target._id),
    ]);
    return res.status(200).json({ success: true, message: "User blocked." });
  } catch (error) {
    console.error("Could not block user:", error);
    return res.status(500).json({ success: false, message: "Could not block user." });
  }
};

export const unblockUser = async (req, res) => {
  const { userId } = req.params;

  if (!isValidId(userId)) {
    return res.status(400).json({ success: false, message: "Invalid user ID." });
  }

  try {
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { blockedUsers: userId } }
    );
    return res.status(200).json({ success: true, message: "User unblocked." });
  } catch (error) {
    console.error("Could not unblock user:", error);
    return res.status(500).json({ success: false, message: "Could not unblock user." });
  }
};

export const listBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("blockedUsers")
      .populate("blockedUsers", "name username avatarUrl");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, blockedUsers: user.blockedUsers });
  } catch (error) {
    console.error("Could not list blocked users:", error);
    return res.status(500).json({ success: false, message: "Could not list blocked users." });
  }
};

export const submitReport = async (req, res) => {
  const { targetType, targetId, reason } = req.body;

  if (!Object.hasOwn(targetModels, targetType)) {
    return res.status(400).json({
      success: false,
      message: "targetType must be post, comment, or user.",
    });
  }
  if (!isValidId(targetId)) {
    return res.status(400).json({ success: false, message: "Invalid target ID." });
  }
  if (
    targetType === "user" &&
    new mongoose.Types.ObjectId(targetId).equals(req.user._id)
  ) {
    return res.status(400).json({ success: false, message: "You cannot report yourself." });
  }
  if (typeof reason !== "string" || !reason.trim() || reason.trim().length > 2000) {
    return res.status(400).json({
      success: false,
      message: "A report reason of 1 to 2000 characters is required.",
    });
  }

  try {
    const target = await targetModels[targetType].findById(targetId).select("_id");
    if (!target) {
      return res.status(404).json({ success: false, message: "Report target not found." });
    }

    const report = await Report.create({
      targetType,
      targetId: target._id,
      reporter: req.user._id,
      reason: reason.trim(),
    });
    return res.status(201).json({
      success: true,
      message: "Report submitted.",
      report: {
        id: report._id,
        targetType: report.targetType,
        targetId: report.targetId,
        status: report.status,
        createdAt: report.createdAt,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You already have an open report for this target.",
      });
    }
    console.error("Could not submit report:", error);
    return res.status(500).json({ success: false, message: "Could not submit report." });
  }
};

export const listReports = async (req, res) => {
  try {
    const { status, targetType } = req.query;
    const filter = {};

    if (status !== undefined) {
      if (!["open", "reviewed", "actioned", "dismissed"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid report status." });
      }
      filter.status = status;
    }
    if (targetType !== undefined) {
      if (!Object.hasOwn(targetModels, targetType)) {
        return res.status(400).json({ success: false, message: "Invalid target type." });
      }
      filter.targetType = targetType;
    }

    const reports = await Report.find(filter)
      .populate("reporter", "name username")
      .populate("moderatedBy", "name username")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("Could not list reports:", error);
    return res.status(500).json({ success: false, message: "Could not list reports." });
  }
};

export const updateReport = async (req, res) => {
  const { reportId } = req.params;
  const { status, adminNotes } = req.body;

  if (!isValidId(reportId)) {
    return res.status(400).json({ success: false, message: "Invalid report ID." });
  }
  if (
    status !== undefined &&
    !["open", "reviewed", "actioned", "dismissed"].includes(status)
  ) {
    return res.status(400).json({ success: false, message: "Invalid report status." });
  }
  if (
    adminNotes !== undefined &&
    (typeof adminNotes !== "string" || adminNotes.length > 5000)
  ) {
    return res.status(400).json({
      success: false,
      message: "Admin notes must be a string of at most 5000 characters.",
    });
  }
  if (status === undefined && adminNotes === undefined) {
    return res.status(400).json({
      success: false,
      message: "Provide a status or adminNotes update.",
    });
  }

  try {
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    if (status !== undefined) {
      report.status = status;
      const now = new Date();
      if (status === "reviewed") report.reviewedAt = now;
      if (status === "actioned") report.actionedAt = now;
      if (status === "dismissed") report.dismissedAt = now;
    }
    if (adminNotes !== undefined) report.adminNotes = adminNotes.trim();
    report.moderatedBy = req.user._id;
    await report.save();

    await report.populate([
      { path: "reporter", select: "name username" },
      { path: "moderatedBy", select: "name username" },
    ]);
    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Could not update report:", error);
    return res.status(500).json({ success: false, message: "Could not update report." });
  }
};
