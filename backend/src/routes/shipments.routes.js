'use strict';

const router = require('express').Router();
const { upsertShipment, getShipments, getShipment, updateShipmentStatus } = require('../controllers/shipments.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getShipments);
router.get('/:tracking', authenticate, getShipment);
router.post('/', authenticate, upsertShipment);
router.put('/:tracking/status', authenticate, updateShipmentStatus);

module.exports = router;
