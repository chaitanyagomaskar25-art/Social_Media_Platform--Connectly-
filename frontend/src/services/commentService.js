
import api from "./api";

export const commentService = {
  async getComments(postId) {
    const response = await api.get(
      `/api/posts/${postId}/comments`
    );

    return response.data;
  },

  async addComment(postId, commentData) {
    const content =
      typeof commentData === "string"
        ? commentData
        : commentData.content ?? commentData.text;

    const parentCommentId =
      commentData && typeof commentData === "object"
        ? commentData.parentCommentId
        : undefined;
    const response = await api.post(`/api/posts/${postId}/comments`, {
      content,
      ...(parentCommentId ? { parentCommentId } : {}),
    });

    return response.data;
  },

  async deleteComment(postId, commentId) {
    const response = await api.delete(
      `/api/posts/${postId}/comments/${commentId}`
    );

    return response.data;
  },

async updateComment(postId, commentId, content) {
  const response = await api.put(
    `/api/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
    { content }
  );

  return response.data;
}

};
