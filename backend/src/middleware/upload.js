'use strict';

const multer  = require('multer');
const sharp   = require('sharp');
const { v4: uuidv4 } = require('uuid');
const fs      = require('fs');
const path    = require('path');
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
 * Delete image file. Handles both local filesystem files and legacy Cloudinary resources.
 */
const deleteImageFile = async (urlOrPublicId) => {
  if (!urlOrPublicId) return;

  // Case 1: Local filesystem paths (relative or absolute)
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
    return;
  }

  // Case 2: Legacy Cloudinary fallback
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
