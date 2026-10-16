const crypto = require("crypto");
const axios = require("axios");

const META_REQUEST_TIMEOUT_MS = 4000;
const DEFAULT_EVENT_SOURCE_URL = "https://pyzara.com/checkout";
const ALLOWED_EVENT_SOURCE_HOSTS = new Set(["pyzara.com", "www.pyzara.com"]);
const MAX_ATTRIBUTION_LENGTH = 500;

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePhone(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";

  const raw = String(value).trim();
  if (!raw) return "";

  let digits = raw.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("01") && digits.length === 11) return `88${digits}`;

  return raw.startsWith("+") ? digits : digits;
}

function sha256(value) {
  if (value === undefined || value === null || value === "") return undefined;
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sanitizeAttributionValue(value) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized || normalized.length > MAX_ATTRIBUTION_LENGTH) return undefined;
  return normalized;
}

function sanitizeEventSourceUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return DEFAULT_EVENT_SOURCE_URL;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !ALLOWED_EVENT_SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
      return DEFAULT_EVENT_SOURCE_URL;
    }
    url.username = "";
    url.password = "";
    url.hash = "";
    return url.toString();
  } catch {
    return DEFAULT_EVENT_SOURCE_URL;
  }
}

function buildUserData({ email, phone, externalId, request, fbp, fbc } = {}) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const normalizedExternalId = externalId === undefined || externalId === null
    ? ""
    : String(externalId).trim();
  const userAgent = typeof request?.get === "function"
    ? sanitizeAttributionValue(request.get("user-agent"))
    : undefined;
  const clientIp = sanitizeAttributionValue(request?.ip);

  return Object.fromEntries(Object.entries({
    em: normalizedEmail ? [sha256(normalizedEmail)] : undefined,
    ph: normalizedPhone ? [sha256(normalizedPhone)] : undefined,
    external_id: normalizedExternalId ? [sha256(normalizedExternalId)] : undefined,
    client_ip_address: clientIp,
    client_user_agent: userAgent,
    fbp: sanitizeAttributionValue(fbp),
    fbc: sanitizeAttributionValue(fbc),
  }).filter(([, value]) => value !== undefined));
}

function buildMetaPayload({
  eventName,
  eventId,
  eventTime,
  eventSourceUrl,
  userData,
  customData,
}) {
  const payload = {
    data: [{
      event_name: eventName,
      event_time: eventTime || Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: sanitizeEventSourceUrl(eventSourceUrl),
      action_source: "website",
      user_data: userData || {},
      custom_data: customData || {},
    }],
  };

  return payload;
}

async function sendMetaEvent({
  eventName,
  eventId,
  eventTime,
  eventSourceUrl,
  userData,
  customData,
  request,
}, options = {}) {
  const env = options.env || process.env;
  const httpClient = options.httpClient || axios;

  if (String(env.META_CAPI_ENABLED).toLowerCase() !== "true") {
    return { sent: false, skipped: true, reason: "disabled" };
  }

  const pixelId = String(env.META_PIXEL_ID || "").trim();
  const accessToken = String(env.META_CAPI_ACCESS_TOKEN || "").trim();
  const graphApiVersion = String(env.META_GRAPH_API_VERSION || "").trim();
  if (!pixelId || !accessToken || !/^v\d+\.\d+$/.test(graphApiVersion)) {
    const error = new Error("Meta CAPI environment configuration is incomplete");
    error.code = "META_CAPI_CONFIG_ERROR";
    throw error;
  }

  const payload = buildMetaPayload({
    eventName,
    eventId,
    eventTime,
    eventSourceUrl,
    userData,
    customData,
  });
  const url = `https://graph.facebook.com/${graphApiVersion}/${encodeURIComponent(pixelId)}/events`;

  const response = await httpClient.post(url, payload, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    timeout: META_REQUEST_TIMEOUT_MS,
  });

  return {
    sent: true,
    skipped: false,
    eventsReceived: response.data?.events_received,
    traceId: response.data?.fbtrace_id,
    requestId: request?.requestId,
  };
}

module.exports = {
  DEFAULT_EVENT_SOURCE_URL,
  normalizeEmail,
  normalizePhone,
  sha256,
  sanitizeAttributionValue,
  sanitizeEventSourceUrl,
  buildUserData,
  buildMetaPayload,
  sendMetaEvent,
};
