'use strict';

const router = require('express').Router();
const { validatePromo, getAdminPromos, createPromo, updatePromo, deletePromo } = require('../controllers/promo.controller');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

router.post('/validate', strictLimiter, validatePromo);

router.get('/', authenticate, getAdminPromos);
router.post('/', authenticate, createPromo);
router.put('/:id', authenticate, updatePromo);
router.delete('/:id', authenticate, deletePromo);

module.exports = router;
