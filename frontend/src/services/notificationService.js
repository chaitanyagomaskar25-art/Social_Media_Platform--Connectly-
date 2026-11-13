
import api from './api';

export const notificationService = {
  async getNotifications(page = 1, limit = 20) {
    const response = await api.get('/api/notifications', {
      params: { page, limit },
    });

    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get(
      '/api/notifications/unread-count'
    );

    return response.data;
  },

  async markAsRead(notificationId) {
    const response = await api.patch(
      `/api/notifications/${encodeURIComponent(notificationId)}/read`
    );

    return response.data;
  },

  async markAllAsRead() {
    const response = await api.patch(
      '/api/notifications/read-all'
    );

    return response.data;
  },

  async deleteNotification(notificationId) {
    const response = await api.delete(
      `/api/notifications/${encodeURIComponent(notificationId)}`
    );

    return response.data;
  },
};
