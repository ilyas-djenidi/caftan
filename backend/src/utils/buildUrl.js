'use strict';

const env = require('../config/env');

/**
 * Returns an absolute URL for any image path.
 * - Already absolute (Cloudinary https:// URL) → returned as-is
 * - Local /uploads/... path → prefixed with BASE_URL
 * - null / undefined → null
 */
const buildUrl = (p) => {
  if (!p) return null;
  if (p.startsWith('http')) return p;
  return `${env.BASE_URL}${p}`;
};

module.exports = { buildUrl };
