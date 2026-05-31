'use strict';

const router = require('express').Router();
const { getSettings, getSetting, upsertSetting } = require('../controllers/siteSettings.controller');
const { authenticate } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

router.get('/', cacheMiddleware(300), getSettings);
router.get('/:key', cacheMiddleware(300), getSetting);
router.put('/:key', authenticate, upsertSetting);

module.exports = router;
