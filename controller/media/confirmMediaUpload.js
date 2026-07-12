const { HeadObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client, getS3ImageConfig } = require("../../config/s3Client");
const logger = require("../../utils/logger");
const {
  normalizeMimeType,
  getMimeConfig,
  getMimeConfigFromFileName,
  buildCloudFrontUrl,
  validateProductMediaKey,
  validateReviewMediaKey,
  validateExpectedMaxSize,
} = require("../../utils/mediaUploadConfig");

async function deleteObject(bucket, key) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

function isAllowedUploadedContentType(actualContentType, expectedContentType) {
  return actualContentType === expectedContentType || actualContentType === "application/octet-stream";
}

module.exports = async function confirmMediaUpload(req, res) {
  const { key, expectedContentType, expectedMaxSize } = req.body || {};
  let normalizedContentType = normalizeMimeType(expectedContentType);

  try {
    const keyValidation = typeof key === "string" && key.startsWith("reviews/approved/")
      ? validateReviewMediaKey(key, req.userId)
      : validateProductMediaKey(key);
    if (!keyValidation.ok) {
      return res.status(400).json({ success: false, error: true, message: keyValidation.message });
    }
    let mimeConfig = getMimeConfig(normalizedContentType);
    if (!mimeConfig || normalizedContentType === "application/octet-stream") {
      const fileName = String(key || "").split("/").pop();
      mimeConfig = getMimeConfigFromFileName(fileName);
      normalizedContentType = mimeConfig?.contentType || normalizedContentType;
    }
    if (!mimeConfig) {
      return res.status(400).json({ success: false, error: true, message: "Unsupported content type" });
    }
    if (!validateExpectedMaxSize(expectedMaxSize, normalizedContentType)) {
      return res.status(400).json({ success: false, error: true, message: "Invalid expectedMaxSize" });
    }

    const { bucket, cloudFrontBaseUrl } = getS3ImageConfig();
    const head = await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    const actualSize = Number(head.ContentLength || 0);
    const actualContentType = normalizeMimeType(head.ContentType);

    if (!actualSize || actualSize > mimeConfig.maxSize || !isAllowedUploadedContentType(actualContentType, normalizedContentType)) {
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
    logger.error("s3_upload_failed", {
      requestId: req.requestId,
      userId: req.userId,
      errorName: err?.name,
      errorMessage: err?.message,
      errorStack: err?.stack,
    });
    return res.status(500).json({ success: false, error: true, message: "Server error" });
  }
};