const { randomUUID } = require("crypto");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { s3Client, getS3ImageConfig } = require("../../config/s3Client");
const {
  CACHE_CONTROL,
  PRESIGNED_UPLOAD_EXPIRES_IN,
  MEDIA_TYPES,
  getMimeConfig,
  validatePositiveInteger,
  isSafeProductId,
  isSafeUploadSessionId,
  buildCloudFrontUrl,
} = require("../../utils/mediaUploadConfig");

module.exports = async function createPresignedUpload(req, res) {
  try {
    const { fileName, contentType, fileSize, mediaType, productId, uploadSessionId } = req.body || {};
    const normalizedContentType = String(contentType || "").toLowerCase();
    const mimeConfig = getMimeConfig(normalizedContentType);
    const mediaConfig = MEDIA_TYPES[mediaType];
    const numericFileSize = Number(fileSize);

    if (!fileName || typeof fileName !== "string") {
      return res.status(400).json({ success: false, error: true, message: "fileName is required" });
    }
    if (!mediaConfig || mediaConfig.enabled === false || !["products", "reviews"].includes(mediaConfig.root)) {
      return res.status(400).json({ success: false, error: true, message: "Invalid media type" });
    }
    if (!mimeConfig || mimeConfig.kind !== mediaConfig.kind) {
      return res.status(400).json({ success: false, error: true, message: "Unsupported content type" });
    }
    if (!validatePositiveInteger(numericFileSize)) {
      return res.status(400).json({ success: false, error: true, message: "Invalid file size" });
    }
    if (numericFileSize > mimeConfig.maxSize) {
      return res.status(400).json({ success: false, error: true, message: "File size exceeds allowed limit" });
    }
    if (productId && !isSafeProductId(String(productId))) {
      return res.status(400).json({ success: false, error: true, message: "Invalid productId" });
    }
    if (mediaType === "review-image") {
      if (!productId) {
        return res.status(400).json({ success: false, error: true, message: "productId is required" });
      }
      if (!isSafeProductId(String(req.userId || ""))) {
        return res.status(400).json({ success: false, error: true, message: "Invalid authenticated user" });
      }
    }
    if (mediaConfig.root === "products" && uploadSessionId && !isSafeUploadSessionId(String(uploadSessionId))) {
      return res.status(400).json({ success: false, error: true, message: "Invalid uploadSessionId" });
    }

    
    const objectName = `${randomUUID()}.${mimeConfig.extension}`;
    const scope = productId ? String(productId) : (uploadSessionId ? String(uploadSessionId) : `draft-${randomUUID()}`);
    const key = mediaType === "review-image"
      ? `reviews/approved/${String(productId)}/${String(req.userId)}/${objectName}`
      : `products/${scope}/${mediaConfig.folder}/${objectName}`;
    const { bucket, cloudFrontBaseUrl } = getS3ImageConfig();

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: normalizedContentType,
      CacheControl: CACHE_CONTROL,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_UPLOAD_EXPIRES_IN });

    return res.json({
      success: true,
      error: false,
      message: "Upload URL created",
      data: {
        uploadUrl,
        key,
        url: buildCloudFrontUrl(cloudFrontBaseUrl, key),
        method: "PUT",
        headers: {
          "Content-Type": normalizedContentType,
          "Cache-Control": CACHE_CONTROL,
        },
        expiresIn: PRESIGNED_UPLOAD_EXPIRES_IN,
         ...(mediaConfig.root === "products" && !productId ? { uploadSessionId: scope } : {}),
      },
    });
  } catch (err) {
    console.error("createPresignedUpload error:", err?.message || err);
    return res.status(500).json({ success: false, error: true, message: "Server error" });
  }
};