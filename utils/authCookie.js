const ONE_YEAR_IN_MS = 365 * 24 * 60 * 60 * 1000;

function isSecureRequest(req) {
  const forwardedProtocol = req?.headers?.["x-forwarded-proto"];
  const protocol = Array.isArray(forwardedProtocol)
    ? forwardedProtocol[0]
    : forwardedProtocol?.split(",")[0]?.trim();

  return (
    process.env.NODE_ENV === "production" ||
    req?.secure === true ||
    protocol === "https"
  );
}

function getAuthCookieOptions(req) {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    secure,
    // SameSite=None cookies are rejected by browsers unless they are Secure.
    // Local HTTP development does not need a cross-site cookie, so use Lax there.
    sameSite: secure ? "none" : "lax",
    path: "/",
    maxAge: ONE_YEAR_IN_MS,
  };
}

function getAuthCookieClearOptions(req) {
  const { maxAge, ...options } = getAuthCookieOptions(req);
  return options;
}

module.exports = {
  getAuthCookieOptions,
  getAuthCookieClearOptions,
  isSecureRequest,
};
