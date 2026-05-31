'use strict';

const router = require('express').Router();

router.use('/health',          require('./health.routes'));
router.use('/auth',            require('./auth.routes'));
router.use('/products',        require('./products.routes'));
router.use('/packs',           require('./packs.routes'));
router.use('/orders',          require('./orders.routes'));
router.use('/promo',           require('./promo.routes'));
router.use('/reviews',         require('./reviews.routes'));
router.use('/messages',        require('./messages.routes'));
router.use('/shipments',       require('./shipments.routes'));
router.use('/shipping-rates',  require('./shippingRates.routes'));
router.use('/hero',            require('./hero.routes'));
router.use('/stats',           require('./stats.routes'));
router.use('/settings',        require('./siteSettings.routes'));
router.use('/upload',          require('./upload.routes'));
router.use('/guepex',          require('./guepex.routes'));

module.exports = router;
