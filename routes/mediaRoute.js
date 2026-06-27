const express = require("express");
const authToken = require("../middleware/authToken");
const isAdmin = require("../middleware/isAdmin");
const createPresignedUpload = require("../controller/media/createPresignedUpload");
const confirmMediaUpload = require("../controller/media/confirmMediaUpload");
const deleteMedia = require("../controller/media/deleteMedia");

const router = express.Router();

router.post("/media/presigned-upload", authToken, createPresignedUpload);
router.post("/media/confirm-upload", authToken, confirmMediaUpload);
router.delete("/media", authToken, deleteMedia);

module.exports = router;