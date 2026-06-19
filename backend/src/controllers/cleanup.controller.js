'use strict';

const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { buildUrl } = require('../utils/buildUrl');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Helper to normalize database URLs to match local relative path e.g. /uploads/products/uuid.webp
const normalizeDbUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads/')) return url;
  const idx = url.indexOf('/uploads/');
  if (idx !== -1) return url.substring(idx);
  return url;
};

// Recursive helper to get directory files list
const getLocalFiles = (dir, relativePrefix = '') => {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.join(relativePrefix, file).replace(/\\/g, '/');
    if (stat.isDirectory()) {
      results.push(...getLocalFiles(filePath, relativePath));
    } else {
      // Ignore seed files starting with photo_
      if (!file.startsWith('photo_')) {
        results.push({
          absolutePath: filePath,
          relativePath: `/uploads/${relativePath}`, // matches DB format
          publicId: relativePath, // e.g. products/uuid.webp
          bytes: stat.size,
          created_at: stat.birthtime,
        });
      }
    }
  }
  return results;
};

// Helper to get total size of files in a directory recursively in bytes
const getDirSize = (dir) => {
  let size = 0;
  if (!fs.existsSync(dir)) return size;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      size += getDirSize(filePath);
    } else {
      size += stat.size;
    }
  }
  return size;
};

// Helper to count total number of files in a directory recursively
const getFileCount = (dir) => {
  let count = 0;
  if (!fs.existsSync(dir)) return count;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      count += getFileCount(filePath);
    } else {
      count++;
    }
  }
  return count;
};

// ── Controller: GET /admin/cleanup/preview ─────────────────────
// Returns a dry-run list of orphaned local images without deleting anything.
const previewOrphans = asyncHandler(async (req, res) => {
  // 1. Gather all image_urls tracked in the DB
  const [prodImgs, packImgs, heroImgs] = await Promise.all([
    query('SELECT image_url FROM product_images'),
    query('SELECT image_url FROM packs WHERE image_url IS NOT NULL'),
    query('SELECT image_url FROM hero_banners WHERE image_url IS NOT NULL'),
  ]);

  const dbUrls = new Set(
    [
      ...prodImgs.rows.map((r) => r.image_url),
      ...packImgs.rows.map((r) => r.image_url),
      ...heroImgs.rows.map((r) => r.image_url),
    ]
      .map(normalizeDbUrl)
      .filter(Boolean)
  );

  // 2. Scan all local files under uploads/
  const localFiles = getLocalFiles(UPLOADS_DIR);

  // 3. Find orphans (in local storage but NOT in DB)
  const orphans = localFiles.filter((f) => !dbUrls.has(f.relativePath));

  res.json({
    success: true,
    total_cloudinary: localFiles.length, // map to UI key
    total_db_referenced: dbUrls.size,    // map to UI key
    orphan_count: orphans.length,        // map to UI key
    orphans: orphans.map((f) => ({
      public_id: f.publicId, // e.g. products/uuid.webp
      url: buildUrl(f.relativePath), // full HTTP path for previewing in UI
      created_at: f.created_at,
      bytes: f.bytes,
    })),
  });
});

// ── Controller: DELETE /admin/cleanup/orphans ──────────────────
// Deletes ALL orphaned local images not referenced in the DB.
const deleteOrphans = asyncHandler(async (req, res) => {
  // 1. Build DB referenced URL set
  const [prodImgs, packImgs, heroImgs] = await Promise.all([
    query('SELECT image_url FROM product_images'),
    query('SELECT image_url FROM packs WHERE image_url IS NOT NULL'),
    query('SELECT image_url FROM hero_banners WHERE image_url IS NOT NULL'),
  ]);

  const dbUrls = new Set(
    [
      ...prodImgs.rows.map((r) => r.image_url),
      ...packImgs.rows.map((r) => r.image_url),
      ...heroImgs.rows.map((r) => r.image_url),
    ]
      .map(normalizeDbUrl)
      .filter(Boolean)
  );

  // 2. Scan all local files
  const localFiles = getLocalFiles(UPLOADS_DIR);
  const orphans = localFiles.filter((f) => !dbUrls.has(f.relativePath));

  if (orphans.length === 0) {
    return res.json({ success: true, deleted: 0, message: 'No local orphans found — storage is clean!' });
  }

  // 3. Delete files from disk
  let deletedCount = 0;
  for (const orphan of orphans) {
    try {
      if (fs.existsSync(orphan.absolutePath)) {
        fs.unlinkSync(orphan.absolutePath);
        deletedCount++;
      }
    } catch (err) {
      console.error(`Failed to delete local orphan: ${orphan.absolutePath}`, err.message);
    }
  }

  res.json({
    success: true,
    deleted: deletedCount,
    orphan_count: orphans.length,
    message: `Deleted ${deletedCount} orphaned image(s) from local storage.`,
  });
});

// ── Controller: GET /admin/cleanup/stats ──────────────────────
// Returns local disk usage stats instead of Cloudinary API stats.
const getCloudinaryStats = asyncHandler(async (req, res) => {
  const totalSizeBytes = getDirSize(UPLOADS_DIR);
  const totalFiles = getFileCount(UPLOADS_DIR);

  const usedMb = (totalSizeBytes / 1024 / 1024).toFixed(2);
  const limitMb = '1000.00'; // 1GB quota
  const percent = ((totalSizeBytes / (1000 * 1024 * 1024)) * 100).toFixed(1);

  res.json({
    success: true,
    plan: 'Local Storage (Statique)',
    storage: {
      used_mb: usedMb,
      limit_mb: limitMb,
      percent: percent,
    },
    bandwidth: {
      used_mb: '0.00',
      limit_mb: 'Illimité',
      percent: '0.0',
    },
    transformations: {
      used: 0,
      limit: 'N/A',
      percent: '0.0',
    },
    objects: totalFiles,
    credits_used_percent: '0.0',
  });
});

module.exports = { previewOrphans, deleteOrphans, getCloudinaryStats };
