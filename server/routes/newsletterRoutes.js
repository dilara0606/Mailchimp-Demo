const express = require('express');
const { addOrUpdateSubscriber, unsubscribe } = require('../controller/newsletterController');
const router = express.Router();

router.post('/Newsletter/Insert', addOrUpdateSubscriber);
router.get('/unsubscribe/:email', unsubscribe);

module.exports = router;
