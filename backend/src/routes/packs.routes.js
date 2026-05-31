'use strict';

const router = require('express').Router();
const { getPacks, getPack, getAdminPacks, createPack, updatePack, deletePack } = require('../controllers/packs.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const cacheMiddleware = require('../middleware/cache');

router.get('/', cacheMiddleware(300), getPacks);
router.get('/admin', authenticate, getAdminPacks);
router.get('/:id', cacheMiddleware(300), getPack);

router.post('/', authenticate, upload.single('image'), createPack);
router.put('/:id', authenticate, upload.single('image'), updatePack);
router.delete('/:id', authenticate, deletePack);

module.exports = router;
