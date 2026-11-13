
import mongoose from 'mongoose';
import { Notification } from '../model/Notification.js';

const getCurrentUserId = (req) => req.user?._id ?? req.user?.id;

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(1, Number.parseInt(query.limit, 10) || 20)
  );

  return { page, limit, skip: (page - 1) * limit };
};

// GET /api/notifications?page=1&limit=20
export const getNotifications = async (req, res, next) => {
  try {
    const userId = getCurrentUserId(req);
    const { page, limit, skip } = parsePagination(req.query);

    const filter = { recipient: userId };

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate('sender', 'name username avatarUrl')
        .populate('post', 'caption imageUrl')
        .populate('comment', 'text')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),

      Notification.countDocuments({
        ...filter,
        readAt: null,
      }),
    ]);

    return res.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: getCurrentUserId(req),
      readAt: null,
    });

    return res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:notificationId/read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!isValidId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID.',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        recipient: getCurrentUserId(req),
        readAt: null,
      },
      { $set: { readAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (!notification) {
      const exists = await Notification.exists({
        _id: notificationId,
        recipient: getCurrentUserId(req),
      });

      if (!exists) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found.',
        });
      }
    }

    return res.json({
      success: true,
      message: 'Notification marked as read.',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read-all
export const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      {
        recipient: getCurrentUserId(req),
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    return res.json({
      success: true,
      message: 'All notifications marked as read.',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:notificationId
export const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    if (!isValidId(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID.',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: getCurrentUserId(req),
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted.',
      notificationId,
    });
  } catch (error) {
    next(error);
  }
};
