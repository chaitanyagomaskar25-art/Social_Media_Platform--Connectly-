import api from "./api";

export const savedPostService = {
  async getSavedPosts(params = {}) {
    const response = await api.get("/api/saved-posts", { params });
    return response.data;
  },

  async getStatus(postId) {
    const response = await api.get(
      `/api/saved-posts/${encodeURIComponent(postId)}/status`
    );
    return response.data;
  },

  async save(postId) {
    const response = await api.post(
      `/api/saved-posts/${encodeURIComponent(postId)}`
    );
    return response.data;
  },

  async remove(postId) {
    const response = await api.delete(
      `/api/saved-posts/${encodeURIComponent(postId)}`
    );
    return response.data;
  },
};
