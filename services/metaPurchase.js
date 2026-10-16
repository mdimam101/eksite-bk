const userModel = require("../models/userModel");
const logger = require("../utils/logger");
const {
  buildUserData,
  sanitizeAttributionValue,
  sanitizeEventSourceUrl,
  sendMetaEvent,
} = require("./metaCapi");

function positiveQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function money(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function buildPurchaseCustomData(order) {
  const META_VALUE_MULTIPLIER = 0.5; // Meta-কে 50% value পাঠাবো
  const contents = (order?.items || []).map((item) => {
    const quantity = positiveQuantity(item.quantity);
    const lineTotal = money(item.price);
    const actualUnitPrice =
      quantity > 0 ? lineTotal / quantity : 0;
    return {
      id: String(item.productId),
      quantity,
      // OrderModel documents that item.price is the full line total.
      // item_price: quantity > 0 ? lineTotal / quantity : 0,
      // Meta-কে actual price-এর 50% পাঠানো
      item_price: actualUnitPrice * META_VALUE_MULTIPLIER,
    };
  });

  // Actual product subtotal
  const actualMerchandiseSubtotal = (order?.items || []).reduce(
    (sum, item) => sum + money(item.price),
    0
  );

   // Discount বাদ দেওয়ার পরে actual value
  const actualMerchandiseValue = Math.max(
    actualMerchandiseSubtotal - money(order?.discount),
    0
  );

  // Meta reported value = actual value-এর 50%
  const metaValue =
    actualMerchandiseValue * META_VALUE_MULTIPLIER;

  const merchandiseSubtotal = contents.reduce(
    (sum, item) => sum + (item.item_price * item.quantity),
    0
  );
  const merchandiseValue = Math.max(merchandiseSubtotal - money(order?.discount), 0);

  return {
    currency: "BDT",
    // value: merchandiseValue,
     // 🔥 Meta Purchase Value
    value: metaValue,
    content_type: "product",
    content_ids: contents.map((item) => item.id),
    contents,
    num_items: contents.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function sanitizeOrderMeta(meta) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return {};
  return {
    fbp: sanitizeAttributionValue(meta.fbp),
    fbc: sanitizeAttributionValue(meta.fbc),
    eventSourceUrl: sanitizeEventSourceUrl(meta.eventSourceUrl),
  };
}

function getPurchaseEventId(orderId) {
  return `purchase_${orderId}`;
}

function buildPurchaseUserData({ order, userId, email, meta, request }) {
  const safeMeta = sanitizeOrderMeta(meta);
  return buildUserData({
    email,
    phone: order.shippingDetails?.phone,
    externalId: userId,
    request,
    fbp: safeMeta.fbp,
    fbc: safeMeta.fbc,
  });
}

async function sendPurchaseEvent({ order, userId, meta, request, metaOptions }) {
  const eventId = getPurchaseEventId(order._id);
  const safeMeta = sanitizeOrderMeta(meta);
  let email;

if (userId) {
  try {
    const user = await userModel
      .findById(userId)
      .select("email")
      .lean();

    email = user?.email;
  } catch {
    email = undefined;
  }
}

  return sendMetaEvent({
    eventName: "Purchase",
    eventId,
    eventTime: Math.floor(new Date(order.createdAt || Date.now()).getTime() / 1000),
    eventSourceUrl: safeMeta.eventSourceUrl,
    userData: buildPurchaseUserData({ order, userId, email, meta: safeMeta, request }),
    customData: buildPurchaseCustomData(order),
    request,
  }, metaOptions);
}

function getSafeMetaError(error) {
  return {
    statusCode: error?.response?.status,
    metaErrorCode: error?.response?.data?.error?.code,
    metaErrorType: error?.response?.data?.error?.type,
    errorCode: error?.code,
  };
}

async function trackPurchaseSafely(args) {
  try {
    return await sendPurchaseEvent(args);
  } catch (error) {
    logger.warn("meta_capi_purchase_failed", {
      requestId: args.request?.requestId,
      orderId: args.order?._id,
      ...getSafeMetaError(error),
    });
    return { sent: false, skipped: false, failed: true };
  }
}

module.exports = {
  buildPurchaseCustomData,
  buildPurchaseUserData,
  sanitizeOrderMeta,
  getPurchaseEventId,
  sendPurchaseEvent,
  trackPurchaseSafely,
};
