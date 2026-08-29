const ALLOWED_ORIGINS = new Set([
  "https://pyzara.com",
  "https://www.pyzara.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function getOriginFromHeader(value) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function sendNotFound(res) {
  return res.status(404).send("404 Not Found");
}

function publicApiProtection(req, res, next) {
  return next();
  const publicClientKey = process.env.PUBLIC_CLIENT_KEY;
  const requestClientKey = req.headers["x-client-key"];
  const requestOrigin = req.headers.origin;
  const refererOrigin = getOriginFromHeader(req.headers.referer);

  const isClientKeyValid =
    publicClientKey && requestClientKey === publicClientKey;

  if (!isClientKeyValid) {
    return sendNotFound(res);
  }

  const hasBrowserSource = requestOrigin || refererOrigin;

  if (hasBrowserSource) {
    const isAllowedOrigin =
      (requestOrigin && ALLOWED_ORIGINS.has(requestOrigin)) ||
      (refererOrigin && ALLOWED_ORIGINS.has(refererOrigin));

    if (!isAllowedOrigin) {
      return sendNotFound(res);
    }
  }

  return next();
}

module.exports = publicApiProtection;