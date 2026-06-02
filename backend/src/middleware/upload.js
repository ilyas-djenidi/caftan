'use strict';

const multer  = require('multer');
const sharp   = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const env     = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VALID_FOLDERS = ['products', 'packs', 'hero', 'accessories', 'sacs'];

// Keep file in memory — Sharp optimises, then we stream to Cloudinary
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
 * Optimise with Sharp then upload to Cloudinary.
 * Returns the Cloudinary result object (secure_url, public_id, …).
 */
const uploadToCloudinary = (buffer, folder) => {
  const safeFolder = VALID_FOLDERS.includes(folder) ? folder : 'products';
  const publicId   = `caftan/${safeFolder}/${uuidv4()}`;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id,
        folder:           `caftan/${safeFolder}`,
        overwrite:        true,
        resource_type:    'image',
        format:           'webp',
        transformation: [
          {
            width:   env.upload.maxWidth,
            crop:    'limit',           // never enlarge
            quality: env.upload.webpQuality,
            fetch_format: 'webp',
          },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Run Sharp first for auto-rotate + server-side optimisation, then pipe to Cloudinary
    sharp(buffer)
      .rotate()                          // fix EXIF orientation
      .resize({
        width: env.upload.maxWidth,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: env.upload.webpQuality })
      .toBuffer()
      .then((optimised) => {
        const { Readable } = require('stream');
        const readable = new Readable();
        readable.push(optimised);
        readable.push(null);
        readable.pipe(stream);
      })
      .catch(reject);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Safe to call without awaiting — failures are logged, not thrown.
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[Cloudinary] delete error:', err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary };
