const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, getS3ImageConfig } = require("../../config/s3Client");
const { validateProductMediaKey, validateReviewMediaKey } = require("../../utils/mediaUploadConfig");

module.exports = async function deleteMedia(req, res) {
  try {
    const { key } = req.body || {};
    const keyValidation = typeof key === "string" && key.startsWith("reviews/approved/")
      ? validateReviewMediaKey(key, req.userId)
      : validateProductMediaKey(key);
    if (!keyValidation.ok) {
      return res.status(400).json({ success: false, error: true, message: keyValidation.message });
    }

    const { bucket } = getS3ImageConfig();
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return res.json({
      success: true,
      error: false,
      message: "Media deleted",
      data: { key },
    });
  } catch (err) {
    console.error("deleteMedia error:", err?.name || err?.message || err);
    return res.status(500).json({ success: false, error: true, message: "Server error" });
  }
};