'use strict';

const router = require('express').Router();
const { getAllRates, getRate, upsertRate } = require('../controllers/shippingRates.controller');
const { authenticate } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

router.get('/', cacheMiddleware(600), getAllRates);
router.get('/:wilaya', cacheMiddleware(600), getRate);
router.put('/:wilaya', authenticate, upsertRate);

module.exports = router;
