
import mongoose from 'mongoose';
import { Readable } from 'node:stream';
import { User } from '../model/User.js';
import cloudinary from '../config/cloudinary.js';
import { createNotification } from '../utils/createNotification.js';
import { recordFollowerSnapshot } from '../utils/recordFollowerSnapshot.js';
import { emitFollowUpdated, emitUserUpdated } from '../socket.js';

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const publicUserFields =
  'name username bio avatarUrl followers following createdAt privateAccount';

const serializeUser = (user, currentUserId = null) => {
  const data = user.toObject ? user.toObject() : { ...user };

  delete data.password;
  delete data.passwordHash;
  delete data.__v;

  data.followersCount = data.followers?.length ?? 0;
  data.followingCount = data.following?.length ?? 0;

  if (currentUserId) {
    data.isFollowing = (data.followers ?? []).some(
      (id) => String(id?._id ?? id) === String(currentUserId)
    );
  }

  delete data.followers;
  delete data.following;

  return data;
};

const getCurrentUserId = (req) => req.user?._id ?? req.user?.id;

const getUserIdentifierQuery = (identifier) => {
  if (isValidId(identifier)) {
    return { _id: identifier };
  }

  return { username: String(identifier).toLowerCase() };
};

// GET /api/users/:identifier
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findOne(
      getUserIdentifierQuery(req.params.identifier)
    ).select(publicUserFields);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      user: serializeUser(user, getCurrentUserId(req)),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/profile
// This route updates the currently logged-in user's profile.
export const updateUserProfile = async (req, res, next) => {
  let uploadedAvatar;
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const allowedFields = ['name', 'username', 'bio', 'avatarUrl', 'privateAccount'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    if (updates.username) {
      updates.username = updates.username.toLowerCase();

      const existingUser = await User.findOne({
        username: updates.username,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken.',
        });
      }
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty.',
      });
    }

    if (
      updates.bio !== undefined &&
      updates.bio.length > 300
    ) {
      return res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 300 characters.',
      });
    }

    const existingUser = await User.findById(userId).select('avatarPublicId');
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (req.file) {
      uploadedAvatar = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'connectly/avatars', resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        Readable.from(req.file.buffer).pipe(stream);
      });
      updates.avatarUrl = uploadedAvatar.secure_url;
      updates.avatarPublicId = uploadedAvatar.public_id;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).select(publicUserFields);

    if (!user) {
      if (uploadedAvatar?.public_id) {
        await cloudinary.uploader.destroy(uploadedAvatar.public_id);
      }
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (
      uploadedAvatar?.public_id &&
      existingUser.avatarPublicId &&
      existingUser.avatarPublicId !== uploadedAvatar.public_id
    ) {
      try {
        await cloudinary.uploader.destroy(existingUser.avatarPublicId);
      } catch (cleanupError) {
        console.error('Previous avatar cleanup failed:', cleanupError);
      }
    }

    const serializedUser = serializeUser(user, userId);
    emitUserUpdated({ user: serializedUser });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: serializedUser,
    });
  } catch (error) {
    if (uploadedAvatar?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadedAvatar.public_id);
      } catch (cleanupError) {
        console.error('Avatar cleanup failed:', cleanupError);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Username or another unique field is already in use.',
      });
    }

    next(error);
  }
};

// POST /api/users/:userId/follow
export const followUser = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    if (String(currentUserId) === String(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
    }

    const [targetUser, currentUser] = await Promise.all([
      User.findById(targetUserId).select('_id privateAccount blockedUsers'),
      User.findById(currentUserId).select('blockedUsers'),
    ]);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (targetUser.privateAccount) {
      return res.status(403).json({
        success: false,
        message: 'This account is private. Send a follow request instead.',
        requiresFollowRequest: true,
      });
    }
    if (
      targetUser.blockedUsers.some((id) => String(id) === String(currentUserId)) ||
      currentUser.blockedUsers.some((id) => String(id) === String(targetUserId))
    ) {
      return res.status(403).json({ success: false, message: 'This follow action is not available.' });
    }

    const alreadyFollowing = await User.exists({
      _id: currentUserId,
      following: targetUserId,
    });

    // $addToSet prevents duplicate IDs.
    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        { $addToSet: { following: targetUserId } }
      ),
      User.updateOne(
        { _id: targetUserId },
        { $addToSet: { followers: currentUserId } }
      ),
    ]);

    if (!alreadyFollowing) {
      await recordFollowerSnapshot(targetUserId);
      await createNotification({
        recipient: targetUserId,
        sender: currentUserId,
        type: 'follow',
      });
    }

    const [targetUpdated, currentUpdated] = await Promise.all([
      User.findById(targetUserId).select('followers').lean(),
      User.findById(currentUserId).select('following').lean(),
    ]);

    emitFollowUpdated({
      followerId: currentUserId,
      followingId: targetUserId,
      action: 'follow',
      followersCount: targetUpdated?.followers?.length || 0,
      followingCount: currentUpdated?.following?.length || 0,
    });

    return res.json({
      success: true,
      message: 'User followed successfully.',
      userId: targetUserId,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/:userId/follow
export const unfollowUser = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.userId;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!isValidId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    if (String(currentUserId) === String(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot unfollow yourself.',
      });
    }

    await Promise.all([
      User.updateOne(
        { _id: currentUserId },
        { $pull: { following: targetUserId } }
      ),
      User.updateOne(
        { _id: targetUserId },
        { $pull: { followers: currentUserId } }
      ),
    ]);
    await recordFollowerSnapshot(targetUserId);

    const [targetUpdated, currentUpdated] = await Promise.all([
      User.findById(targetUserId).select('followers').lean(),
      User.findById(currentUserId).select('following').lean(),
    ]);

    emitFollowUpdated({
      followerId: currentUserId,
      followingId: targetUserId,
      action: 'unfollow',
      followersCount: targetUpdated?.followers?.length || 0,
      followingCount: currentUpdated?.following?.length || 0,
    });

    return res.json({
      success: true,
      message: 'User unfollowed successfully.',
      userId: targetUserId,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:userId/followers?page=1&limit=20
export const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const user = await User.findById(userId)
      .select('followers')
      .populate({
        path: 'followers',
        select: 'name username bio avatarUrl',
        options: {
          sort: { username: 1 },
          skip: (page - 1) * limit,
          limit,
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      followers: user.followers,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:userId/following?page=1&limit=20
export const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const user = await User.findById(userId)
      .select('following')
      .populate({
        path: 'following',
        select: 'name username bio avatarUrl',
        options: {
          sort: { username: 1 },
          skip: (page - 1) * limit,
          limit,
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.json({
      success: true,
      following: user.following,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/search?q=chaitanya&page=1&limit=10
export const searchUsers = async (req, res, next) => {
  try {
    const query = String(req.query.q ?? '').trim();

    if (!query) {
      return res.json({ success: true, users: [] });
    }

    if (query.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Search query is too long.',
      });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const currentUserId = getCurrentUserId(req);

    const filter = {
      $or: [
        { username: { $regex: escapedQuery, $options: 'i' } },
        { name: { $regex: escapedQuery, $options: 'i' } },
      ],
    };

    if (currentUserId) {
      filter._id = { $ne: currentUserId };
    }

    const users = await User.find(filter)
      .select('name username bio avatarUrl')
      .sort({ username: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      users,
      page,
      limit,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/suggested?limit=5
export const getSuggestedUsers = async (req, res, next) => {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 5)
    );

    const currentUser = await User.findById(currentUserId)
      .select('following')
      .lean();

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const excludedIds = [
      currentUserId,
      ...(currentUser.following ?? []),
    ];

    const users = await User.find({
      _id: { $nin: excludedIds },
    })
      .select('name username bio avatarUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};
