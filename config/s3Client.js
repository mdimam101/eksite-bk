const { S3Client } = require("@aws-sdk/client-s3");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function getS3ImageConfig() {
  return {
    bucket: requireEnv("S3_IMAGE_BUCKET"),
    region: requireEnv("S3_IMAGE_REGION"),
    cloudFrontBaseUrl: requireEnv("CLOUDFRONT_IMAGE_URL").replace(/\/+$/, ""),
  };
}

const s3Client = new S3Client({
  region: requireEnv("S3_IMAGE_REGION"),
});

module.exports = {
  s3Client,
  getS3ImageConfig,
};