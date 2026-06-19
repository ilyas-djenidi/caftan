'use strict';

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const {
  previewOrphans,
  deleteOrphans,
  getCloudinaryStats,
} = require('../controllers/cleanup.controller');

// All routes require admin authentication
router.use(authenticate);

// GET  /api/admin/cleanup/stats    — Cloudinary usage (bandwidth, storage)
router.get('/stats', getCloudinaryStats);

// GET  /api/admin/cleanup/preview  — Dry-run: list orphaned images (no delete)
router.get('/preview', previewOrphans);

// DELETE /api/admin/cleanup/orphans — Delete all orphaned Cloudinary images
router.delete('/orphans', deleteOrphans);

module.exports = router;
