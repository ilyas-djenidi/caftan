'use strict';

const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');
const ApiError      = require('../utils/ApiError');
const asyncHandler  = require('../utils/asyncHandler');

const VALID_FOLDERS = ['products', 'packs', 'hero', 'accessories', 'sacs'];

/**
 * POST /api/upload/image
 * Body (multipart): image (file), folder (string, optional)
 * Returns: { url, public_id }
 */
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const folder = VALID_FOLDERS.includes(req.body.folder) ? req.body.folder : 'products';
  const result = await uploadToCloudinary(req.file.buffer, folder);

  res.json({
    success: true,
    data: {
      url:       result.secure_url,
      public_id: result.public_id,
    },
  });
});

/**
 * DELETE /api/upload/image
 * Body: { public_id: "caftan/products/uuid" }
 */
const deleteImage = asyncHandler(async (req, res) => {
  const { public_id } = req.body;
  if (!public_id) throw ApiError.badRequest('public_id is required');

  // Security: only allow deleting images in our own Cloudinary folder
  if (!public_id.startsWith('caftan/')) {
    throw ApiError.forbidden('Cannot delete images outside the caftan folder');
  }

  await deleteFromCloudinary(public_id);
  res.json({ success: true, message: 'Image deleted' });
});

module.exports = { uploadImage, deleteImage };
