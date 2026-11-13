import mongoose from 'mongoose';
import { FollowRequest } from '../model/FollowRequest.js';
import { User } from '../model/User.js';
import { createNotification } from '../utils/createNotification.js';
import { recordFollowerSnapshot } from '../utils/recordFollowerSnapshot.js';
import { emitFollowUpdated, emitFollowRequestUpdated } from '../socket.js';

export const sendFollowRequest = async (req, res, next) => {
  try {
    const recipientId = req.params.userId;
    const requesterId = req.user._id;
    if (!mongoose.isValidObjectId(recipientId) || String(recipientId) === String(requesterId)) {
      return res.status(400).json({ success: false, message: 'Invalid follow request target.' });
    }

    const [recipient, requester] = await Promise.all([
      User.findById(recipientId).select('privateAccount followers blockedUsers'),
      User.findById(requesterId).select('blockedUsers'),
    ]);
    if (!recipient) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!recipient.privateAccount) return res.status(400).json({ success: false, message: 'This account does not require follow requests.' });
    if (
      recipient.blockedUsers.some((id) => String(id) === String(requesterId)) ||
      requester.blockedUsers.some((id) => String(id) === String(recipientId))
    ) return res.status(403).json({ success: false, message: 'This follow request is not available.' });
    if (recipient.followers.some((id) => String(id) === String(requesterId))) {
      return res.status(409).json({ success: false, message: 'You already follow this user.' });
    }

    const request = await FollowRequest.findOneAndUpdate(
      { requester: requesterId, recipient: recipientId, status: 'pending' },
      { $setOnInsert: { requester: requesterId, recipient: recipientId, status: 'pending' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    emitFollowRequestUpdated({
      requesterId,
      recipientId,
      action: 'created',
      request,
    });

    return res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

export const getFollowRequests = async (req, res, next) => {
  try {
    const requests = await FollowRequest.find({ recipient: req.user._id, status: 'pending' })
      .populate('requester', 'name username avatarUrl')
      .sort({ createdAt: -1 })
      .lean();
    return res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

export const getFollowRequestStatus = async (req, res, next) => {
  try {
    const recipientId = req.params.userId;
    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID.' });
    }
    const request = await FollowRequest.findOne({
      requester: req.user._id,
      recipient: recipientId,
      status: 'pending',
    }).select('_id status');
    return res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

export const respondToFollowRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body;
    if (!mongoose.isValidObjectId(requestId) || !['accept', 'decline'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid follow request action.' });
    }

    const request = await FollowRequest.findOne({ _id: requestId, recipient: req.user._id, status: 'pending' });
    if (!request) return res.status(404).json({ success: false, message: 'Pending follow request not found.' });

    if (action === 'accept') {
      await Promise.all([
        User.updateOne({ _id: request.requester }, { $addToSet: { following: request.recipient } }),
        User.updateOne({ _id: request.recipient }, { $addToSet: { followers: request.requester } }),
        createNotification({ recipient: request.requester, sender: request.recipient, type: 'follow' }),
      ]);
      await recordFollowerSnapshot(request.recipient);

      const [targetUpdated, requesterUpdated] = await Promise.all([
        User.findById(request.recipient).select('followers').lean(),
        User.findById(request.requester).select('following').lean(),
      ]);

      emitFollowUpdated({
        followerId: request.requester,
        followingId: request.recipient,
        action: 'follow',
        followersCount: targetUpdated?.followers?.length || 0,
        followingCount: requesterUpdated?.following?.length || 0,
      });
    }
    request.status = action === 'accept' ? 'accepted' : 'declined';
    await request.save();

    emitFollowRequestUpdated({
      requesterId: request.requester,
      recipientId: request.recipient,
      action,
      request,
    });

    return res.json({ success: true, request });
  } catch (error) {
    next(error);
  }
};
