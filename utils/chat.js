const mongoose = require("mongoose");

const MAX_MESSAGE_LENGTH = 5000;
const GUEST_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]{5,127}$/;

function normalizeGuestId(value) {
  if (value === undefined || value === null || value === "") return null;
  const guestId = String(value).trim();
  return GUEST_ID_PATTERN.test(guestId) ? guestId : null;
}

function normalizeMessage(value) {
  if (typeof value !== "string") return null;
  const message = value.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  return message;
}

function isObjectId(value) {
  return mongoose.isValidObjectId(value);
}

function getPagination(query) {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 50, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

module.exports = {
  MAX_MESSAGE_LENGTH,
  normalizeGuestId,
  normalizeMessage,
  isObjectId,
  getPagination,
};
