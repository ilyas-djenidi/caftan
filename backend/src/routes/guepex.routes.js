'use strict';

const router = require('express').Router();
const {
  getWilayas, getCommunes, getCenters, getFees,
  getAllParcels, getParcel, getParcelHistory,
  createParcel, updateParcel, cancelParcel, printLabel,
} = require('../controllers/guepex.controller');
const { authenticate } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cache');

// Public (no auth needed for delivery fees lookup during checkout)
router.get('/wilayas', cacheMiddleware(3600), getWilayas);
router.get('/communes/:wilayaId', cacheMiddleware(3600), getCommunes);
router.get('/centers/:wilayaId', cacheMiddleware(3600), getCenters);
router.get('/fees/:fromWilaya/:toWilaya', cacheMiddleware(600), getFees);

// Admin only
router.get('/parcels', authenticate, getAllParcels);
router.get('/parcels/:tracking', authenticate, getParcel);
router.get('/parcels/:tracking/history', authenticate, getParcelHistory);
router.get('/parcels/:tracking/label', printLabel);
router.post('/parcels', authenticate, createParcel);
router.put('/parcels/:tracking', authenticate, updateParcel);
router.delete('/parcels/:tracking', authenticate, cancelParcel);

module.exports = router;
