const mongoose = require('mongoose');
const User = require('../models/userModel');
const Common = require('../models/commonModel');
const Order = require('../models/OrderModel');
const Device = require('../models/InstallCampaignDevice');
const { deviceKey } = require('./installCampaign');

function failure(message, status = 409) { return Object.assign(new Error(message), { status }); }
async function atomic(work) {
  await Device.init();
  for (let attempt = 0; attempt < 3; attempt++) {
    try { return await mongoose.connection.transaction(work); }
    catch (error) {
      if (error.code === 11000 && error.keyPattern?.deviceKey && attempt < 2) continue;
      if (error.code === 20 || error.codeName === 'IllegalOperation') throw failure('App first-order campaign requires MongoDB replica-set transactions', 503);
      throw error;
    }
  }
}
async function lockUser(userId, session) {
  const user = await User.findOneAndUpdate({ _id: userId }, { $inc: { firstOrderCampaignVersion: 1 } }, { session, new: true });
  if (!user) throw failure('User not found', 404);
  return user;
}
async function placeAppOrder(payload, deviceId) {
  if (!payload.userId) throw failure('Login required', 401);
  // Missing/unsupported device evidence cannot earn, but does not block checkout.
  let key;
  if (deviceId != null && deviceId !== '') {
    try { key = deviceKey(deviceId); } catch { /* ineligible evidence */ }
  }
  return atomic(async session => {
    const user = await lockUser(payload.userId, session);
    const previousOrder = await Order.exists({ userId: user._id }).session(session);
    const placed = user.hasPlacedFirstOrder || user.firstOrderRewardGranted || previousOrder || !user.firstOrderHistoryVerified;
    const common = await Common.findOne().sort({ createdAt: -1, _id: -1 }).session(session);
    let device = key ? await Device.findOne({ deviceKey: key }).session(session) : null;
    const alreadyClaimed = device?.firstOrderRewardClaimed === true;
    const points = common?.firstOrderRewardPoints ?? 300;
    const eligible = !placed && !!key && !alreadyClaimed && common?.firstOrderCampaignEnabled === true && Number.isSafeInteger(points) && points > 0;
    const request = { eligible, rewardPoints: eligible ? points : 0, status: eligible ? 'pending' : 'not_eligible', ...(eligible ? { requestedAt: new Date() } : {}) };
    const [order] = await Order.create([{ ...payload, firstOrderReward: request }], { session });
    user.hasPlacedFirstOrder = true;
    await user.save({ session });
    // Reserve the device even when OFF/ineligible: deleting an account never makes its first order new.
    if (key && !alreadyClaimed) {
      if (!device) device = new Device({ deviceKey: key, userId: user._id });
      device.firstOrderRewardClaimed = true;
      device.firstOrderRewardUserId = user._id;
      device.firstOrderRewardOrderId = order._id;
      device.firstOrderRewardPoints = request.rewardPoints;
      device.firstOrderRewardStatus = request.status;
      device.firstOrderRequestedAt = request.requestedAt;
      await device.save({ session });
    }
    return order;
  });
}
async function review(orderId, status, adminId) {
  if (!mongoose.isObjectIdOrHexString(orderId) || !['approved', 'rejected'].includes(status)) throw failure('Provide an order ID and approved/rejected status', 400);
  return atomic(async session => {
    const device = await Device.findOne({ firstOrderRewardOrderId: orderId }).session(session);
    if (!device || device.firstOrderRewardStatus === 'not_eligible') throw failure('No eligible first-order request', 404);
    if (device.firstOrderRewardStatus !== 'pending') {
      if (device.firstOrderRewardStatus === status) return device;
      throw failure('Request already reviewed');
    }
    if (status === 'approved') {
      const user = await lockUser(device.firstOrderRewardUserId, session);
      const amount = device.firstOrderRewardPoints;
      if (user.firstOrderRewardGranted) throw failure('Account already received its first-order reward');
      if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(user.point) || user.point < 0 || !Number.isSafeInteger(user.point + amount)) throw failure('Invalid point balance or frozen reward');
      const credited = await User.updateOne({ _id: user._id, firstOrderRewardGranted: { $ne: true } },
        { $inc: { point: amount }, $set: { firstOrderRewardGranted: true } }, { session });
      if (!credited.modifiedCount) throw failure('Account unavailable or reward already credited');
      device.firstOrderRewardGranted = true;
    }
    device.firstOrderRewardStatus = status;
    device.firstOrderReviewedAt = new Date();
    device.firstOrderReviewedBy = adminId;
    await device.save({ session });
    // The legacy cancel endpoint may have deleted the order. The durable request still exists.
    await Order.updateOne({ _id: orderId }, { $set: {
      'firstOrderReward.status': status, 'firstOrderReward.reviewedAt': device.firstOrderReviewedAt,
      'firstOrderReward.reviewedBy': adminId,
    } }, { session });
    return device;
  });
}
module.exports = { placeAppOrder, review };

async function rememberDeletedAccountHistory(user) {
  if (!user) return;
  const placed = user.hasPlacedFirstOrder || await Order.exists({ userId: user._id });
  if (!placed) return;
  const identities = [{ userId: user._id }];
  if (user.deviceId) {
    try { identities.push({ deviceKey: deviceKey(user.deviceId) }); } catch { /* legacy unsupported ID */ }
  }
  // Do not overwrite an existing pending/approved/rejected device request.
  await Device.updateMany({ $or: identities, firstOrderRewardClaimed: { $ne: true } }, { $set: {
    firstOrderRewardClaimed: true, firstOrderRewardUserId: user._id, firstOrderRewardStatus: 'not_eligible',
  } });
}
module.exports.rememberDeletedAccountHistory = rememberDeletedAccountHistory;