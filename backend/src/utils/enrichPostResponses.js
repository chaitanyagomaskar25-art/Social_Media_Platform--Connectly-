import { Comment } from '../model/Comment.js';
import { SavedPost } from '../model/savedPostModel.js';

export const enrichPostResponses = async (posts, currentUserId = null) => {
  const postObjects = posts.map((post) =>
    post.toObject ? post.toObject() : post
  );

  if (!postObjects.length) return [];

  const postIds = postObjects.map((post) => post._id);
  const [counts, savedPosts] = await Promise.all([
    Comment.aggregate([
      { $match: { post: { $in: postIds } } },
      { $group: { _id: '$post', count: { $sum: 1 } } },
    ]),
    currentUserId
      ? SavedPost.find({
          user: currentUserId,
          post: { $in: postIds },
        }).select('post').lean()
      : [],
  ]);
  const countByPostId = new Map(
    counts.map((item) => [String(item._id), item.count])
  );
  const savedPostIds = new Set(savedPosts.map((item) => String(item.post)));

  return postObjects.map((post) => {
    const likes = post.likes || [];
    return {
      ...post,
      likesCount: likes.length,
      commentCount: countByPostId.get(String(post._id)) || 0,
      isSaved: savedPostIds.has(String(post._id)),
      isLiked: Boolean(
        currentUserId &&
          likes.some((id) => String(id?._id ?? id) === String(currentUserId))
      ),
    };
  });
};
