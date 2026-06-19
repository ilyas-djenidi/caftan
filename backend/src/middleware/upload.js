'use strict';

const multer  = require('multer');
const sharp   = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs      = require('fs');
const path    = require('path');
const env     = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VALID_FOLDERS = ['products', 'packs', 'hero', 'accessories'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Only JPEG, PNG, WebP, or GIF images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024 },
});

/**
 * Optimise with Sharp and save locally to uploads/ directory.
 * Returns the relative path e.g. /uploads/products/uuid.webp
 */
const processImage = async (buffer, folder) => {
  const safeFolder = VALID_FOLDERS.includes(folder) ? folder : 'products';
  const filename = `${uuidv4()}.webp`;
  const relativePath = `/uploads/${safeFolder}/${filename}`;
  const absoluteDir = path.join(__dirname, '../../uploads', safeFolder);

  // Ensure directory exists
  if (!fs.existsSync(absoluteDir)) {
    fs.mkdirSync(absoluteDir, { recursive: true });
  }

  const absolutePath = path.join(absoluteDir, filename);

  // Run Sharp first for auto-rotate + server-side optimisation, then write to file
  await sharp(buffer)
    .rotate()                          // fix EXIF orientation
    .resize({
      width: 2400,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: 92 })
    .toFile(absolutePath);

  console.log(`[Upload] Saved image locally: ${relativePath}`);
  return relativePath;
};

/**
 * Delete image file from the local filesystem.
 */
const deleteImageFile = async (urlOrPublicId) => {
  if (!urlOrPublicId) return;

  // Local filesystem paths (relative or absolute)
  if (urlOrPublicId.startsWith('/uploads/') || urlOrPublicId.includes('/uploads/')) {
    let relativePath = urlOrPublicId;
    if (urlOrPublicId.startsWith('http')) {
      const idx = urlOrPublicId.indexOf('/uploads/');
      if (idx !== -1) {
        relativePath = urlOrPublicId.substring(idx);
      }
    }

    // Protect seed files starting with photo_
    const filename = path.basename(relativePath);
    if (filename.startsWith('photo_')) {
      console.log('[Upload] skipping deletion of local seed file:', relativePath);
      return;
    }

    try {
      const absolutePath = path.join(__dirname, '../..', relativePath);
      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
        console.log(`[Upload] Deleted local file: ${absolutePath}`);
      } else {
        console.log(`[Upload] Local file not found for deletion: ${absolutePath}`);
      }
    } catch (err) {
      console.error(`[Upload] Failed to delete local file ${relativePath}:`, err.message);
    }
  }
};

module.exports = {
  upload,
  processImage,
  deleteImageFile,
};
