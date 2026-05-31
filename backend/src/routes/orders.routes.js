'use strict';

const router = require('express').Router();
const {
  createOrder, getAdminOrders, getOrderById,
  updateOrderStatus, updateOrderGuepex,
  deleteOrder, getShippedOrders, getDeliveryStats,
} = require('../controllers/orders.controller');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

// Public
router.post('/', strictLimiter, createOrder);

// Admin
router.get('/', authenticate, getAdminOrders);
router.get('/shipped', authenticate, getShippedOrders);
router.get('/delivery-stats', authenticate, getDeliveryStats);
router.get('/:id', authenticate, getOrderById);
router.put('/:id/status', authenticate, updateOrderStatus);
router.put('/:id/guepex', authenticate, updateOrderGuepex);
router.delete('/:id', authenticate, deleteOrder);

module.exports = router;
