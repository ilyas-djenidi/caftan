'use strict';

const router = require('express').Router();
const { uploadImage, deleteImage } = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/image', authenticate, upload.single('image'), uploadImage);
router.delete('/image', authenticate, deleteImage);

module.exports = router;
