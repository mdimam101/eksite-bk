const { randomUUID } = require("crypto");
const logger = require("../utils/logger");

function getHeader(req, name) {
  return req.headers?.[name] || req.headers?.[name.toLowerCase()];
}

function getAwsContext(req) {
  return req.apiGateway?.context || req.apiGateway?.event?.requestContext || {};
}

function getRequestId(req) {
  return (
    getHeader(req, "x-request-id") ||
    getAwsContext(req).awsRequestId ||
    getAwsContext(req).requestId ||
    randomUUID()
  );
}

function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();
  const requestId = String(getRequestId(req));
  const awsContext = getAwsContext(req);

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const data = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.userId,
      awsRequestId: awsContext.awsRequestId,
      functionName: awsContext.functionName,
      functionVersion: awsContext.functionVersion,
    };

    if (res.statusCode >= 500) {
      logger.error("api_request_completed", data);
    } else if (res.statusCode >= 400) {
      logger.warn("api_request_completed", data);
    } else {
      logger.info("api_request_completed", data);
    }
  });

  next();
}

function errorLogger(err, req, res, next) {
  logger.error("unhandled_api_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl || req.url,
    userId: req.userId,
    errorName: err?.name,
    errorMessage: err?.message,
    errorStack: err?.stack,
    statusCode: res.statusCode >= 400 ? res.statusCode : err?.status || err?.statusCode || 500,
  });

  next(err);
}

module.exports = {
  requestLogger,
  errorLogger,
};