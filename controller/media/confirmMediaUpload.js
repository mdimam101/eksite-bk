const { HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, getS3ImageConfig } = require("../../config/s3Client");
const {
  getMimeConfig,
  buildCloudFrontUrl,
  validateProductMediaKey,
  validateReviewMediaKey,
  validateExpectedMaxSize,
} = require("../../utils/mediaUploadConfig");

async function deleteObject(bucket, key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

module.exports = async function confirmMediaUpload(req, res) {
  const { key, expectedContentType, expectedMaxSize } = req.body || {};
  const normalizedContentType = String(expectedContentType || "").toLowerCase();

  try {
    const keyValidation = typeof key === "string" && key.startsWith("reviews/approved/")
      ? validateReviewMediaKey(key, req.userId)
      : validateProductMediaKey(key);
    if (!keyValidation.ok) {
      return res.status(400).json({ success: false, error: true, message: keyValidation.message });
    }
    const mimeConfig = getMimeConfig(normalizedContentType);
    if (!mimeConfig) {
      return res.status(400).json({ success: false, error: true, message: "Unsupported content type" });
    }
    if (!validateExpectedMaxSize(expectedMaxSize, normalizedContentType)) {
      return res.status(400).json({ success: false, error: true, message: "Invalid expectedMaxSize" });
    }

    const { bucket, cloudFrontBaseUrl } = getS3ImageConfig();
    const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const actualSize = Number(head.ContentLength || 0);
    const actualContentType = String(head.ContentType || "").toLowerCase();

    if (!actualSize || actualSize > mimeConfig.maxSize || actualContentType !== normalizedContentType) {
      await deleteObject(bucket, key);
      return res.status(400).json({ success: false, error: true, message: "Uploaded object failed validation" });
    }

    return res.json({
      success: true,
      error: false,
      message: "Upload confirmed",
      data: {
        key,
        url: buildCloudFrontUrl(cloudFrontBaseUrl, key),
        contentType: actualContentType,
        size: actualSize,
        ...(head.ETag ? { etag: head.ETag } : {}),
      },
    });
  } catch (err) {
    console.error("confirmMediaUpload error:", err?.name || err?.message || err);
    return res.status(500).json({ success: false, error: true, message: "Server error" });
  }
};