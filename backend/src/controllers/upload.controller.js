'use strict';

const { processImage, deleteImageFile } = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const VALID_FOLDERS = ['products', 'packs', 'hero'];

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const folder = VALID_FOLDERS.includes(req.body.folder) ? req.body.folder : 'products';
  const urlPath = await processImage(req.file.buffer, folder);

  res.json({
    success: true,
    data: {
      url: `${env.BASE_URL}${urlPath}`,
      path: urlPath,
    },
  });
});

const deleteImage = asyncHandler(async (req, res) => {
  const { path: urlPath } = req.body;
  if (!urlPath) throw ApiError.badRequest('path is required');

  // Security: only allow deleting from our uploads directory
  if (!urlPath.startsWith('/uploads/')) {
    throw ApiError.forbidden('Cannot delete file outside uploads directory');
  }

  deleteImageFile(urlPath);
  res.json({ success: true, message: 'Image deleted' });
});

module.exports = { uploadImage, deleteImage };
