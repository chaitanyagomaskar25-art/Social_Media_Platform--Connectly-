
import express from 'express';

import {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
} from '../controller/userController.js';

import { requireAuth } from '../middleware/authMiddleware.js';
import { optionalAuth } from '../middleware/optionalAuth.js';
import {
  getFollowRequests,
  getFollowRequestStatus,
  respondToFollowRequest,
  sendFollowRequest,
} from '../controller/followRequestController.js';

export const router = express.Router();

// Keep specific routes before /:identifier.
router.get('/search', optionalAuth, searchUsers);
router.get('/suggested', requireAuth, getSuggestedUsers);
router.get('/follow-requests', requireAuth, getFollowRequests);
router.get('/:userId/follow-request', requireAuth, getFollowRequestStatus);
router.patch('/follow-requests/:requestId', requireAuth, respondToFollowRequest);
router.post('/:userId/follow-request', requireAuth, sendFollowRequest);

router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

router.post('/:userId/follow', requireAuth, followUser);
router.delete('/:userId/follow', requireAuth, unfollowUser);

router.get('/:identifier', optionalAuth, getUserProfile);
