import { User } from '../model/User.js';

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const allowedKeys = ['likes', 'comments', 'follows', 'mentions'];
    const updates = {};
    for (const key of allowedKeys) {
      if (typeof req.body[key] === 'boolean') updates[`notificationPreferences.${key}`] = req.body[key];
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: 'Provide at least one boolean preference.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: 'after' }
    ).select('notificationPreferences');
    return res.json({ success: true, notificationPreferences: user.notificationPreferences });
  } catch (error) {
    next(error);
  }
};
