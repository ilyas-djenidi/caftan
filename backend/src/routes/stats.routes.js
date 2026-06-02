'use strict';

const router = require('express').Router();
const { getDashboardStats, getAdminCounts } = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

router.get('/dashboard', authenticate, cacheMiddleware(120), getDashboardStats);
// Single endpoint replacing 3 sidebar polling requests — cache 30s
router.get('/counts',    authenticate, cacheMiddleware(30),  getAdminCounts);

module.exports = router;
