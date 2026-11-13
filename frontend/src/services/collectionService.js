import api from "./api";

export const collectionService = {
  async getCollections() {
    const response = await api.get("/api/collections");
    return response.data;
  },

  async createCollection(data) {
    const response = await api.post("/api/collections", data);
    return response.data;
  },

  async updateCollection(collectionId, data) {
    const response = await api.patch(
      `/api/collections/${encodeURIComponent(collectionId)}`,
      data
    );
    return response.data;
  },

  async deleteCollection(collectionId) {
    const response = await api.delete(
      `/api/collections/${encodeURIComponent(collectionId)}`
    );
    return response.data;
  },

  async getCollectionPosts(collectionId, params = {}) {
    const response = await api.get(
      `/api/collections/${encodeURIComponent(collectionId)}/posts`,
      { params }
    );
    return response.data;
  },

  async addPost(collectionId, postId) {
    const response = await api.post(
      `/api/collections/${encodeURIComponent(collectionId)}/posts/${encodeURIComponent(postId)}`
    );
    return response.data;
  },

  async removePost(collectionId, postId) {
    const response = await api.delete(
      `/api/collections/${encodeURIComponent(collectionId)}/posts/${encodeURIComponent(postId)}`
    );
    return response.data;
  },
};
