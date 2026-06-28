const IMAGE_MAX_SIZE = 10 * 1024 * 1024;
const VIDEO_MAX_SIZE = 50 * 1024 * 1024;
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const PRESIGNED_UPLOAD_EXPIRES_IN = 300;

const MIME_CONFIG = Object.freeze({
  "image/jpeg": { extension: "jpg", kind: "image", maxSize: IMAGE_MAX_SIZE },
  "image/png": { extension: "png", kind: "image", maxSize: IMAGE_MAX_SIZE },
  "image/webp": { extension: "webp", kind: "image", maxSize: IMAGE_MAX_SIZE },
  "video/mp4": { extension: "mp4", kind: "video", maxSize: VIDEO_MAX_SIZE },
  "video/webm": { extension: "webm", kind: "video", maxSize: VIDEO_MAX_SIZE },
  "video/quicktime": { extension: "mov", kind: "video", maxSize: VIDEO_MAX_SIZE },
});

const MEDIA_TYPES = Object.freeze({
  "product-image": { root: "products", folder: "original", kind: "image", requiresAdmin: true },
  "product-video": { root: "products", folder: "video", kind: "video", requiresAdmin: true },
  "video-thumbnail": { root: "products", folder: "thumbnail", kind: "image", requiresAdmin: true },
 "review-image": {
    kind: "image",
    root: "reviews",
    folder: "approved",
    enabled: true,
  },
  "review-video": { root: "reviews", folder: "pending", kind: "video", requiresAdmin: false, enabled: false },
});

const SAFE_SCOPE_PATTERN = /^[A-Za-z0-9_-]{8,80}$/;
const SAFE_PRODUCT_ID_PATTERN = /^[A-Fa-f0-9]{24}$/;

function getMimeConfig(contentType) {
  return MIME_CONFIG[String(contentType || "").toLowerCase()];
}

function validatePositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isSafeProductId(productId) {
  return typeof productId === "string" && SAFE_PRODUCT_ID_PATTERN.test(productId);
}

function isSafeUploadSessionId(uploadSessionId) {
  return typeof uploadSessionId === "string" && SAFE_SCOPE_PATTERN.test(uploadSessionId);
}

function buildCloudFrontUrl(baseUrl, key) {
  return `${String(baseUrl || "").replace(/\/+$/, "")}/${key}`;
}

function hasPathTraversal(value) {
  const raw = String(value || "");
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch (e) {
    return true;
  }

  return (
    raw.includes("\\") ||
    decoded.includes("\\") ||
    raw.includes("..") ||
    decoded.includes("..") ||
    raw.includes("%2e") ||
    raw.includes("%2E")
  );
}

function validateProductMediaKey(key) {
  if (typeof key !== "string" || !key.startsWith("products/")) {
    return { ok: false, message: "Invalid media key" };
  }
  if (hasPathTraversal(key)) {
    return { ok: false, message: "Invalid media key" };
  }
  if (key.includes("//") || key.split("/").some(segment => segment.trim() === "")) {
    return { ok: false, message: "Invalid media key" };
  }
  const allowed = /^products\/[A-Za-z0-9_-]+\/(original|video|thumbnail)\/[A-Fa-f0-9-]+\.(jpg|png|webp|mp4|webm|mov)$/;
  if (!allowed.test(key)) {
    return { ok: false, message: "Invalid media key" };
  } 
  return { ok: true };
}

function validateReviewMediaKey(key, expectedUserId) {
  if (typeof key !== "string" || key.trim() === "" || !key.startsWith("reviews/approved/")) {
    return { ok: false, message: "Invalid media key" };
  }
  if (hasPathTraversal(key) || /%2f|%2F|%5c|%5C/.test(key)) {
    return { ok: false, message: "Invalid media key" };
  }
  if (key.includes("//") || key.split("/").some(segment => segment.trim() === "")) {
    return { ok: false, message: "Invalid media key" };
  }

  const segments = key.split("/");
  if (segments.length !== 5 || segments[0] !== "reviews" || segments[1] !== "approved") {
    return { ok: false, message: "Invalid media key" };
  }

  const [, , productId, userId, fileName] = segments;
  if (!isSafeProductId(productId)) {
    return { ok: false, message: "Invalid media key" };
  }
  if (!isSafeProductId(userId) || !isSafeProductId(String(expectedUserId || "")) || userId !== String(expectedUserId)) {
    return { ok: false, message: "Invalid media key" };
  }
  if (!/^[A-Fa-f0-9-]+\.(jpg|jpeg|png|webp)$/.test(fileName)) {
    return { ok: false, message: "Invalid media key" };
  }

  return { ok: true };
}

function validateExpectedMaxSize(expectedMaxSize, contentType) {
  const mimeConfig = getMimeConfig(contentType);
  if (!mimeConfig) return false;
  if (expectedMaxSize === undefined || expectedMaxSize === null || expectedMaxSize === "") {
    return true;
  }
  const numeric = Number(expectedMaxSize);
  return validatePositiveInteger(numeric) && numeric <= mimeConfig.maxSize;
}

module.exports = {
  CACHE_CONTROL,
  PRESIGNED_UPLOAD_EXPIRES_IN,
  MIME_CONFIG,
  MEDIA_TYPES,
  getMimeConfig,
  validatePositiveInteger,
  isSafeProductId,
  isSafeUploadSessionId,
  buildCloudFrontUrl,
  validateProductMediaKey,
  validateReviewMediaKey,
  validateExpectedMaxSize,
};