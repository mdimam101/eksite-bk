const { defaultProvider } = require("@aws-sdk/credential-provider-node");
const { SignatureV4 } = require("@smithy/signature-v4");
const { HttpRequest } = require("@smithy/protocol-http");
const { Hash } = require("@smithy/hash-node");
const { NodeHttpHandler } = require("@smithy/node-http-handler");
const WebsocketConnection = require("../models/websocketConnectionModel");
const logger = require("./logger");

const requestHandler = new NodeHttpHandler();

function getRegion(endpoint) {
  const match = new URL(endpoint).hostname.match(/\.execute-api\.([^.]+)\.amazonaws\.com$/);
  return match?.[1] || process.env.AWS_REGION || process.env.S3_IMAGE_REGION;
}

async function postToConnection(connection, body) {
  const endpoint = new URL(connection.endpoint);
  const signer = new SignatureV4({
    credentials: defaultProvider(),
    region: getRegion(connection.endpoint),
    service: "execute-api",
    sha256: Hash.bind(null, "sha256"),
  });
  const path = `${endpoint.pathname.replace(/\/$/, "")}/@connections/${encodeURIComponent(connection.connectionId)}`;
  const request = new HttpRequest({
    protocol: endpoint.protocol,
    hostname: endpoint.hostname,
    method: "POST",
    path,
    headers: {
      host: endpoint.hostname,
      "content-type": "application/json",
      "content-length": String(body.length),
    },
    body,
  });
  const response = await requestHandler.handle(await signer.sign(request));
  const statusCode = response.response.statusCode;
  response.response.body?.destroy?.();
  if (statusCode >= 300) {
    const error = new Error(`WebSocket delivery returned ${statusCode}`);
    error.statusCode = statusCode;
    throw error;
  }
}

async function sendToConnections(connections, payload) {
  const body = Buffer.from(JSON.stringify(payload));

  const results = await Promise.allSettled(
    connections.map(async (connection) => {
      try {
        await postToConnection(connection, body);
      } catch (error) {
        if (error?.$metadata?.httpStatusCode === 410 || error?.statusCode === 410) {
          await WebsocketConnection.deleteOne({ connectionId: connection.connectionId });
          return;
        }
        throw error;
      }
    })
  );

  results.forEach((result) => {
    if (result.status === "rejected") {
      logger.warn("websocket_delivery_failed", {
        errorName: result.reason?.name,
        errorMessage: result.reason?.message,
      });
    }
  });
}

async function notifyAdmins(payload) {
  const connections = await WebsocketConnection.find({ connectionType: "ADMIN" }).lean();
  await sendToConnections(connections, payload);
}

async function notifyCustomer(conversation, payload) {
  const identities = [];
  if (conversation.userId) identities.push({ connectionType: "USER", userId: conversation.userId });
  if (conversation.guestId) identities.push({ connectionType: "GUEST", guestId: conversation.guestId });
  if (!identities.length) return;

  const connections = await WebsocketConnection.find({ $or: identities }).lean();
  await sendToConnections(connections, payload);
}

module.exports = { notifyAdmins, notifyCustomer, sendToConnections };
