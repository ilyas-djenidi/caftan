'use strict';

const router = require('express').Router();
const { getActiveBanners, getAdminBanners, createBanner, updateBanner, deleteBanner } = require('../controllers/hero.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const cacheMiddleware = require('../middleware/cache');

router.get('/', cacheMiddleware(300), getActiveBanners);
router.get('/admin', authenticate, getAdminBanners);

router.post('/', authenticate, upload.single('image'), createBanner);
router.put('/:id', authenticate, upload.single('image'), updateBanner);
router.delete('/:id', authenticate, deleteBanner);

module.exports = router;
