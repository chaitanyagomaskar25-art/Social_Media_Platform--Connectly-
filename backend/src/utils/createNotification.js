import { Notification } from '../model/Notification.js';
import { User } from '../model/User.js';
import { emitNotification, emitNotificationDeleted } from '../socket.js';

export const createNotification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
}) => {
  if (String(recipient) === String(sender)) return;

  const preferenceKey = {
    like: 'likes',
    comment: 'comments',
    follow: 'follows',
    mention: 'mentions',
    reply: 'comments',
  }[type];
  if (preferenceKey) {
    const recipientUser = await User.findById(recipient)
      .select(`notificationPreferences.${preferenceKey}`)
      .lean();
    if (recipientUser?.notificationPreferences?.[preferenceKey] === false) return;
  }

  const filter = { recipient, sender, type, post, comment };
  const notification = await Notification.findOneAndUpdate(
    filter,
    { $set: { readAt: null }, $setOnInsert: filter },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  )
    .populate('sender', 'name username avatarUrl')
    .populate('post', 'caption imageUrl')
    .populate('comment', 'text');

  if (notification) {
    const unreadCount = await Notification.countDocuments({
      recipient,
      readAt: null,
    });
    emitNotification(recipient, {
      notification: notification.toObject ? notification.toObject() : notification,
      unreadCount,
    });
  }

  return notification;
};

export const deleteNotification = async (filter) => {
  await Notification.deleteMany(filter);
  if (filter?.recipient) {
    const unreadCount = await Notification.countDocuments({
      recipient: filter.recipient,
      readAt: null,
    });
    emitNotificationDeleted(filter.recipient, {
      filter,
      unreadCount,
    });
  }
};
