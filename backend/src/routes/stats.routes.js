'use strict';

const router = require('express').Router();
const { getDashboardStats } = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

router.get('/dashboard', authenticate, cacheMiddleware(120), getDashboardStats);

module.exports = router;
