'use strict';

const router = require('express').Router();
const { getProductReviews, createReview, getAdminReviews, updateReviewStatus, deleteReview } = require('../controllers/reviews.controller');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', strictLimiter, createReview);

router.get('/', authenticate, getAdminReviews);
router.put('/:id/status', authenticate, updateReviewStatus);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
