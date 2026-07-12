const SENSITIVE_KEYS = new Set([
  "password",
  "otp",
  "code",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "apiKey",
  "secret",
  "clientKey",
  "cardNumber",
  "cvv",
]);

function getEnvironment() {
  return process.env.STAGE || process.env.NODE_ENV || process.env.SLS_STAGE || "unknown";
}

function safeValue(value, seen) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value.toString === "function" && value._bsontype === "ObjectId") {
    return value.toString();
  }
  if (value instanceof Error) {
    return {
      errorName: value.name,
      errorMessage: value.message,
      errorStack: value.stack,
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => safeValue(item, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    const output = {};
    Object.keys(value).slice(0, 50).forEach((key) => {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
        output[key] = "[REDACTED]";
        return;
      }
      output[key] = safeValue(value[key], seen);
    });

    seen.delete(value);
    return output;
  }
  return value;
}

function sanitize(data) {
  if (!data) return {};
  try {
    return safeValue(data, new WeakSet()) || {};
  } catch {
    return { sanitizeError: true };
  }
}

function write(level, event, data) {
  try {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      service: "pyzara-api",
      environment: getEnvironment(),
      ...sanitize(data),
    };

    if (level === "ERROR") {
      console.error(JSON.stringify(payload));
    } else if (level === "WARN") {
      console.warn(JSON.stringify(payload));
    } else {
      console.log(JSON.stringify(payload));
    }
  } catch {
    // Logging must never break API execution.
  }
}

module.exports = {
  info: (event, data) => write("INFO", event, data),
  warn: (event, data) => write("WARN", event, data),
  error: (event, data) => write("ERROR", event, data),
};