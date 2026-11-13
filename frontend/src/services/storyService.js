import api from './api';

export const storyService = {
  async list() {
    const response = await api.get('/api/stories');
    return response.data;
  },
  async create(file, caption) {
    const formData = new FormData();
    formData.append('media', file);
    if (caption !== undefined && caption !== null) {
      formData.append('caption', caption);
    }
    const response = await api.post('/api/stories', formData);
    return response.data;
  },
  async markViewed(storyId) {
    const response = await api.post(`/api/stories/${encodeURIComponent(storyId)}/view`);
    return response.data;
  },
  async deleteStory(storyId) {
    const response = await api.delete(`/api/stories/${encodeURIComponent(storyId)}`);
    return response.data;
  },
  async updateStory(storyId, { file, caption }) {
    const formData = new FormData();
    if (file) formData.append('media', file);
    if (caption !== undefined) formData.append('caption', caption);
    const response = await api.put(`/api/stories/${encodeURIComponent(storyId)}`, formData);
    return response.data;
  },
  async getViewers(storyId) {
    const response = await api.get(`/api/stories/${encodeURIComponent(storyId)}/viewers`);
    return response.data;
  },
};
