'use strict';

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOADS_ROOT = path.join(__dirname, '../../uploads');
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Multer keeps file in memory — Sharp does the actual write
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
 * Process an uploaded file with Sharp:
 * - Convert to WebP
 * - Resize if wider than maxWidth
 * - Returns the saved URL path
 */
const processImage = async (buffer, folder) => {
  const dir = path.join(UPLOADS_ROOT, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `${uuidv4()}.webp`;
  const filepath = path.join(dir, filename);

  await sharp(buffer)
    .rotate() // auto-rotate based on EXIF
    .resize({
      width: env.upload.maxWidth,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({ quality: env.upload.webpQuality })
    .toFile(filepath);

  return `/uploads/${folder}/${filename}`;
};

/**
 * Delete a file given its URL path (e.g. /uploads/products/xxx.webp)
 */
const deleteImageFile = (urlPath) => {
  if (!urlPath) return;
  const rel = urlPath.replace(/^\/uploads\//, '');
  const abs = path.join(UPLOADS_ROOT, rel);
  if (fs.existsSync(abs)) {
    fs.unlinkSync(abs);
  }
};

module.exports = { upload, processImage, deleteImageFile };
