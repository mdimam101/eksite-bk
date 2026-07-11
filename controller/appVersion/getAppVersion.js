const compareSemanticVersions = require("../../utils/compareSemanticVersions");

const DEFAULT_ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.emamexp2.testeasupload&pcampaignid=web_share";

function getAndroidUpdateConfig() {
  return {
    latestVersion: process.env.ANDROID_LATEST_VERSION || "1.0.1",
    playStoreUrl:
      process.env.ANDROID_PLAY_STORE_URL || DEFAULT_ANDROID_PLAY_STORE_URL,
    title: process.env.ANDROID_UPDATE_TITLE || "নতুন আপডেট এসেছে",
    message:
      process.env.ANDROID_UPDATE_MESSAGE ||
      "ভালো অভিজ্ঞতার জন্য অ্যাপটি আপডেট করুন।",
  };
}

function normalizePlatform(platform) {
  return String(platform || "android").trim().toLowerCase() || "android";
}

async function getAppVersion(req, res) {
  try {
    const platform = normalizePlatform(req.query?.platform);
    const currentVersion = String(req.query?.currentVersion || "").trim();

    if (platform !== "android") {
      return res.status(400).json({
        success: false,
        message: "Unsupported platform",
        platform,
      });
    }

    const config = getAndroidUpdateConfig();
    const updateAvailable = currentVersion
      ? compareSemanticVersions(currentVersion, config.latestVersion) < 0
      : false;

    return res.json({
      success: true,
      platform,
      currentVersion: currentVersion || null,
      latestVersion: config.latestVersion,
      updateAvailable,
      playStoreUrl: config.playStoreUrl,
      title: config.title,
      message: config.message,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to check app version",
    });
  }
}

module.exports = getAppVersion;