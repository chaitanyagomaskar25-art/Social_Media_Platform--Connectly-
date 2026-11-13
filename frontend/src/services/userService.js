
import api from './api';

export const userService = {
  /**
   * Get a user's profile by ID or username.
   */
  async getUserProfile(identifier) {
    if (!identifier || !String(identifier).trim()) {
      throw new Error('User ID or username is required.');
    }

    const response = await api.get(
      `/api/users/${encodeURIComponent(String(identifier))}`
    );

    return response.data;
  },

  /**
   * Update the currently authenticated user's profile.
   * Expected fields: name, username, bio, avatarUrl,
   * currentPassword, newPassword.
   */
  async updateProfile(profileData) {
    if (!profileData || typeof profileData !== 'object') {
      throw new Error('Profile data is required.');
    }

    const response = await api.patch(
      '/api/auth/profile',
      profileData
    );

    return response.data;
  },

  /**
   * Follow a user.
   */
  async followUser(userId) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const response = await api.post(
      `/api/users/${encodeURIComponent(String(userId))}/follow`
    );

    return response.data;
  },

  /**
   * Unfollow a user.
   */
  async unfollowUser(userId) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const response = await api.delete(
      `/api/users/${encodeURIComponent(String(userId))}/follow`
    );

    return response.data;
  },

  /**
   * Get a user's followers.
   */
  async getFollowers(userId, page = 1, limit = 20) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const response = await api.get(
      `/api/users/${encodeURIComponent(String(userId))}/followers`,
      { params: { page, limit } }
    );

    return response.data;
  },

  /**
   * Get the users that a user follows.
   */
  async getFollowing(userId, page = 1, limit = 20) {
    if (!userId) {
      throw new Error('User ID is required.');
    }

    const response = await api.get(
      `/api/users/${encodeURIComponent(String(userId))}/following`,
      { params: { page, limit } }
    );

    return response.data;
  },

  /**
   * Search users.
   */
  async searchUsers(query, page = 1, limit = 10) {
    const normalizedQuery = String(query ?? '').trim();

    if (!normalizedQuery) {
      return { users: [] };
    }

    const response = await api.get('/api/users/search', {
      params: {
        q: normalizedQuery,
        page,
        limit,
      },
    });

    return response.data;
  },

  /**
   * Get suggested users for the feed or sidebar.
   */
  async getSuggestedUsers(limit = 5) {
    const response = await api.get('/api/users/suggested', {
      params: { limit },
    });

    return response.data;
  },

  async sendFollowRequest(userId) {
    const response = await api.post(`/api/users/${encodeURIComponent(userId)}/follow-request`);
    return response.data;
  },
  async getFollowRequestStatus(userId) {
    const response = await api.get(`/api/users/${encodeURIComponent(userId)}/follow-request`);
    return response.data;
  },

  async getFollowRequests() {
    const response = await api.get('/api/users/follow-requests');
    return response.data;
  },

  async respondToFollowRequest(requestId, action) {
    const response = await api.patch(`/api/users/follow-requests/${encodeURIComponent(requestId)}`, { action });
    return response.data;
  },

  async updateNotificationPreferences(preferences) {
    const response = await api.patch('/api/auth/notification-preferences', preferences);
    return response.data;
  },

  async getBlockedUsers() {
    const response = await api.get('/api/moderation/blocks');
    return response.data;
  },

  async unblockUser(userId) {
    const response = await api.delete(`/api/moderation/blocks/${encodeURIComponent(userId)}`);
    return response.data;
  },

  async blockUser(userId) {
    const response = await api.post(`/api/moderation/blocks/${encodeURIComponent(userId)}`);
    return response.data;
  },

  async reportContent(targetType, targetId, reason) {
    const response = await api.post('/api/moderation/reports', { targetType, targetId, reason });
    return response.data;
  },

  async listReports(params = {}) {
    const response = await api.get('/api/moderation/admin/reports', { params });
    return response.data;
  },

  async updateReport(reportId, updates) {
    const response = await api.patch(`/api/moderation/admin/reports/${encodeURIComponent(reportId)}`, updates);
    return response.data;
  },
};
