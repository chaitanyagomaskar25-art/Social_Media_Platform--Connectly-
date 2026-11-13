import { User } from "../model/User.js";

export const canViewUserContent = async (viewerId, authorId) => {
  const author = await User.findById(authorId)
    .select("privateAccount followers blockedUsers")
    .lean();
  if (!author) return false;
  if (!viewerId) return !author.privateAccount;
  if (String(viewerId) === String(authorId)) return true;

  const viewer = await User.findById(viewerId).select("blockedUsers").lean();
  if (!viewer) return false;
  const isBlocked = (ids, target) => ids.some((id) => String(id) === String(target));
  if (
    isBlocked(viewer.blockedUsers || [], authorId) ||
    isBlocked(author.blockedUsers || [], viewerId)
  ) return false;
  return !author.privateAccount || isBlocked(author.followers || [], viewerId);
};

export const getVisibleAuthorIds = async (viewerId) => {
  const viewer = viewerId
    ? await User.findById(viewerId).select("blockedUsers").lean()
    : null;
  if (viewerId && !viewer) return [];

  const filter = viewer
    ? {
        _id: { $nin: viewer.blockedUsers || [] },
        blockedUsers: { $ne: viewerId },
        $or: [
          { privateAccount: { $ne: true } },
          { followers: viewerId },
          { _id: viewerId },
        ],
      }
    : { privateAccount: { $ne: true } };

  return User.distinct("_id", filter);
};
