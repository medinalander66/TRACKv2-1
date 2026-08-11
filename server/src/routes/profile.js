const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { submitChangeRequest } = require('../controllers/profileController');

router.post('/change-request', authenticate, submitChangeRequest);

module.exports = router;