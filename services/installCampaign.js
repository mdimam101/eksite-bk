const { createHash } = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Common = require('../models/commonModel');
const Device = require('../models/InstallCampaignDevice');

function deviceKey(deviceId) {
  if (typeof deviceId !== 'string' || !deviceId.trim() || deviceId.length > 256) throw new Error('Invalid deviceId');
  return createHash('sha256').update(`install-campaign:${deviceId.trim()}`).digest('hex');
}
async function settings() {
  return Common.findOne().sort({ createdAt: -1, _id: -1 });
}
async function createAccount(payload, clientPlatform, campaignDeviceId = payload.deviceId) {
  const isApp = clientPlatform === 'android' || clientPlatform === 'ios';
  const safe = { ...payload, point: 0, installRewardGranted: false, hasPlacedFirstOrder: false, firstOrderRewardGranted: false, firstOrderHistoryVerified: true, firstOrderCampaignVersion: 0 };
  if (!campaignDeviceId) return { user: await User.create(safe), installReward: { granted: false, points: 0 } };
  const key = deviceKey(campaignDeviceId);
  await Device.init();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await mongoose.connection.transaction(async session => {
        // Only account creation can grant a reward; sign-in/existing-account calls cannot.
        const existingDeviceAccount = await User.exists({ deviceId: campaignDeviceId }).session(session);
        if (existingDeviceAccount && payload.deviceId) throw new Error('Already user exist');
        const known = await Device.findOne({ deviceKey: key }).session(session);
        const common = await Common.findOne().sort({ createdAt: -1, _id: -1 }).session(session);
        const amount = common?.installRewardPoints ?? 200;
        const granted = isApp && !known && !existingDeviceAccount && common?.installCampaignEnabled === true && Number.isSafeInteger(amount) && amount > 0;
        const [user] = await User.create([{ ...safe, point: granted ? amount : 0, installRewardGranted: granted }], { session });
        // Record even campaign-OFF registrations, so deleting an old account does not make a device new.
        if (!known) await Device.create([{ deviceKey: key, userId: existingDeviceAccount?._id || user._id, rewardGranted: granted, rewardPoints: granted ? amount : 0 }], { session });
        return { user, installReward: { granted, points: granted ? amount : 0 } };
      });
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.deviceKey && attempt < 2) continue;
      if (error.code === 20 || error.codeName === 'IllegalOperation') throw new Error('Device signup requires MongoDB replica-set transactions');
      if (error.code === 11000) throw new Error('Already user exist');
      throw error;
    }
  }
}
async function rememberDevice(user) {
  if (!user?.deviceId) return;
  const key = deviceKey(user.deviceId);
  await Device.init();
  try {
    await Device.updateOne({ deviceKey: key }, { $setOnInsert: { userId: user._id,
      rewardGranted: user.installRewardGranted === true, rewardPoints: 0 } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) throw error;
    // A parallel registration/deletion already retained the same device.
    if (!await Device.exists({ deviceKey: key })) throw error;
  }
}
module.exports = { createAccount, rememberDevice, settings, deviceKey };