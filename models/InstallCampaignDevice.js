const mongoose = require('mongoose');

// Kept after account deletion. No TTL: a seen device cannot become new again.
const schema = new mongoose.Schema({
  deviceKey: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  // Reserved at the first observed app order, not released by cancellation/deletion/rejection.
  firstOrderRewardClaimed: { type: Boolean, default: false },
  firstOrderRewardGranted: { type: Boolean, default: false },
  firstOrderRewardUserId: { type: mongoose.Schema.Types.ObjectId, index: true },
  firstOrderRewardOrderId: { type: mongoose.Schema.Types.ObjectId, index: true },
  firstOrderRewardPoints: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
  firstOrderRewardStatus: { type: String, enum: ['not_eligible', 'pending', 'approved', 'rejected'], default: 'not_eligible', index: true },
  firstOrderRequestedAt: Date,
  firstOrderReviewedAt: Date,
  firstOrderReviewedBy: mongoose.Schema.Types.ObjectId,
  rewardGranted: { type: Boolean, default: false },
  rewardPoints: { type: Number, default: 0, min: 0, validate: Number.isSafeInteger },
}, { timestamps: true });

module.exports = mongoose.model('InstallCampaignDevice', schema);