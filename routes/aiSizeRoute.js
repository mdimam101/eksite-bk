const express = require("express");
const router = express.Router();

const aiSizeRecommendController = require("../controller/aiSize/aiSizeRecommendController");

router.post("/ai-size-recommend", aiSizeRecommendController);

module.exports = router;