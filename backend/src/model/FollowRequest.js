import mongoose from 'mongoose';

const followRequestSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
}, { timestamps: true });

followRequestSchema.index({ requester: 1, recipient: 1, status: 1 });
followRequestSchema.index({ recipient: 1, status: 1, createdAt: -1 });

export const FollowRequest = mongoose.models.FollowRequest ||
  mongoose.model('FollowRequest', followRequestSchema);
