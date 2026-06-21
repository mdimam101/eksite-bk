const express = require("express");
const router = express.Router();

const aiSkincareRecommendController = require("../controller/aiSize/aiSkincareRecommendController");

router.post("/ai-skincare-recommend", aiSkincareRecommendController);

module.exports = router;