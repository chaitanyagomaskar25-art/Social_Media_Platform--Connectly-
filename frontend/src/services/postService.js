
import api from "./api";

export const postService = {
  async getFeed(params = {}) {
    const response = await api.get("/api/posts/feed", {
      params: {
        page: 1,
        limit: 10,
        ...params,
      },
    });

    return response.data;
  },

  async getPostById(id) {
    const response = await api.get(`/api/posts/${id}`);
    return response.data;
  },

  async createPost({ caption, image, images = [], video }) {
    const formData = new FormData();

    formData.append('caption', caption ?? '');
    for (const file of images) {
      formData.append('images', file);
    }
    if (video) {
      formData.append('video', video);
    } else if (image && !images.length) {
      formData.append('image', image);
    }

    const response = await api.post('/api/posts', formData);

    return response.data;
  },

  async likePost(id) {
    const response = await api.post(`/api/posts/${id}/like`);
    return response.data;
  },

  async unlikePost(id) {
    const response = await api.delete(`/api/posts/${id}/like`);
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/api/posts/${id}`);
    return response.data;
  },

  async getUserPosts(userId) {
    const response = await api.get(`/api/posts/user/${userId}`);
    return response.data;
  },

  async searchPosts(params = {}) {
    const response = await api.get("/api/posts/search", { params });
    return response.data;
  },

  async getTrendingHashtags(params = {}) {
    const response = await api.get("/api/posts/trending-hashtags", { params });
    return response.data;
  },

  async updatePost(postId, postData) {
    const formData = new FormData();

    if (postData.caption !== undefined) {
      formData.append("caption", postData.caption);
    }

    for (const image of postData.images || []) {
      formData.append("images", image);
    }
    if (postData.video) {
      formData.append("video", postData.video);
    } else if (postData.image) {
      formData.append("image", postData.image);
    }

    if (postData.removeImage) {
      formData.append("removeImage", "true");
    }

    const response = await api.put(
      `/api/posts/${encodeURIComponent(postId)}`,
      formData
    );

    return response.data;
  },
};
