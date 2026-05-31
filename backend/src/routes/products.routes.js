'use strict';

const router = require('express').Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct, getAdminProducts, getProductAdmin,
} = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const cacheMiddleware = require('../middleware/cache');

// Public
router.get('/', cacheMiddleware(120), getProducts);
router.get('/admin', authenticate, getAdminProducts);
router.get('/admin/:id', authenticate, getProductAdmin);
router.get('/:id', cacheMiddleware(300), getProduct);

// Admin
router.post('/', authenticate, upload.array('images', 10), createProduct);
router.put('/:id', authenticate, upload.array('images', 10), updateProduct);
router.delete('/:id', authenticate, deleteProduct);

module.exports = router;
