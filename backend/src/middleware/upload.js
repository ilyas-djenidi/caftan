'use strict';

const multer  = require('multer');
const sharp   = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');
const env     = require('../config/env');
const ApiError = require('../utils/ApiError');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VALID_FOLDERS = ['products', 'packs', 'hero', 'accessories'];

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
  // Use just the uuid as publicId since folder is supplied separately
  const publicId   = uuidv4();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder:           `caftan/${safeFolder}`,
        overwrite:        true,
        resource_type:    'image',
        format:           'webp',
        transformation: [
          {
            width:   2400,
            crop:    'limit',           // never enlarge
            quality: 100,               // Sharp already encoded — no double-compression
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
        width: 2400,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: 92 })
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
    const decodedId = decodeURIComponent(publicId);
    console.log(`[Cloudinary] Deleting image with publicId: ${decodedId}`);
    const result = await cloudinary.uploader.destroy(decodedId, { invalidate: true });
    console.log(`[Cloudinary] Delete result:`, result);
  } catch (err) {
    console.error('[Cloudinary] delete error:', err.message);
  }
};

/**
 * Compatibility wrapper for legacy code: process image using Cloudinary.
 * Returns the secure URL.
 */
const processImage = async (buffer, folder) => {
  const result = await uploadToCloudinary(buffer, folder);
  return result.secure_url;
};

/**
 * Compatibility wrapper for legacy code: delete image using Cloudinary.
 * Safely extracts public_id if passed a full Cloudinary URL.
 */
const deleteImageFile = async (urlOrPublicId) => {
  if (!urlOrPublicId) return;
  if (urlOrPublicId.startsWith('/uploads/')) {
    console.log('[Upload] skipping deletion of local seed file:', urlOrPublicId);
    return;
  }
  let publicId = urlOrPublicId;
  if (urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://')) {
    const match = urlOrPublicId.match(/\/upload\/(?:v\d+\/)?(caftan\/[^\.]+)/);
    if (match && match[1]) {
      publicId = match[1];
    } else {
      const idx = urlOrPublicId.indexOf('caftan/');
      if (idx !== -1) {
        publicId = urlOrPublicId.substring(idx).split('.')[0];
      }
    }
  }
  await deleteFromCloudinary(publicId);
};

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  processImage,
  deleteImageFile,
};
