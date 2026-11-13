
import express from 'express';

import { requireAuth } from '../middleware/authMiddleware.js';

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controller/notificationController.js';

export const router = express.Router();

// All notification endpoints require authentication.
router.use(requireAuth);

// Keep specific routes before routes containing IDs.
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:notificationId/read', markNotificationAsRead);

router.delete('/:notificationId', deleteNotification);

