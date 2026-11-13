import api from './api';

export const analyticsService = {
  async getCreatorAnalytics(days = 30) {
    const response = await api.get('/api/analytics', { params: { days } });
    return response.data.data;
  },
};
