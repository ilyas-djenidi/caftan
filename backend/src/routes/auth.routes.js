'use strict';

const router = require('express').Router();
const { login, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

router.post('/login', strictLimiter, login);
router.get('/me', authenticate, getMe);

module.exports = router;
