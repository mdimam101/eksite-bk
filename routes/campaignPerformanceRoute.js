const router = require('express').Router();
const authToken = require('../middleware/authToken');
const isAdmin = require('../middleware/isAdmin');
const controller = require('../controller/campaignPerformance');

router.post('/campaign-performance', controller.create);
router.get('/campaign-performance', authToken, isAdmin, controller.list);
router.delete('/campaign-performance/:campaignId', authToken, isAdmin, controller.remove);
module.exports = router;
