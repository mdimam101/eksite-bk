const express = require("express");
const mediaAuthToken = require("../middleware/mediaAuthToken");

const createPresignedUpload = require("../controller/media/createPresignedUpload");
const confirmMediaUpload = require("../controller/media/confirmMediaUpload");
const deleteMedia = require("../controller/media/deleteMedia");

const router = express.Router();

router.post("/media/presigned-upload", mediaAuthToken, createPresignedUpload);

router.post(
  "/media/confirm-upload",
  mediaAuthToken,
  confirmMediaUpload
);

router.delete(
  "/media",
  mediaAuthToken,
  deleteMedia
);

module.exports = router;