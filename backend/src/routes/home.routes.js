'use strict';

const router = require('express').Router();
const { getHomeData } = require('../controllers/home.controller');
const cacheMiddleware = require('../middleware/cache');

// Cache landing page data for 5 minutes — hits DB only once every 5 min per server
router.get('/', cacheMiddleware(300), getHomeData);

module.exports = router;
