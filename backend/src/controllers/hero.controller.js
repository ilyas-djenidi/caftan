'use strict';

const { query } = require('../config/database');
const { processImage, deleteImageFile } = require('../middleware/upload');
const { del, delPattern } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const buildUrl = (p) => {
  if (!p) return null;
  if (p.startsWith('http')) return p;  // already absolute (e.g. Supabase CDN)
  return `${env.BASE_URL}${p}`;
};


const getActiveBanners = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, title_part1, title_accent, title_part2, subtitle, cta_text, image_url, sort_order
     FROM hero_banners
     WHERE is_active = TRUE
     ORDER BY sort_order ASC`
  );
  res.json({
    success: true,
    data: result.rows.map((b) => ({ ...b, image_url: buildUrl(b.image_url) })),
  });
});

const getAdminBanners = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM hero_banners ORDER BY sort_order ASC');
  res.json({
    success: true,
    data: result.rows.map((b) => ({ ...b, image_url: buildUrl(b.image_url) })),
  });
});

const createBanner = asyncHandler(async (req, res) => {
  const { title_part1, title_accent, title_part2, subtitle, cta_text, is_active, sort_order } = req.body;

  let imageUrl = null;
  if (req.file) imageUrl = await processImage(req.file.buffer, 'hero');

  const result = await query(
    `INSERT INTO hero_banners
       (title_part1, title_accent, title_part2, subtitle, cta_text, image_url, is_active, sort_order)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      title_part1 ?? null, title_accent ?? null, title_part2 ?? null,
      subtitle ?? null, cta_text ?? null, imageUrl,
      is_active !== 'false' && is_active !== false,
      parseInt(sort_order ?? 0, 10),
    ]
  );
  await delPattern('cache:/api/hero*');
  res.status(201).json({ success: true, data: result.rows[0] });
});

const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await query('SELECT image_url FROM hero_banners WHERE id = $1', [id]);
  if (!existing.rows[0]) throw ApiError.notFound('Banner not found');

  const { title_part1, title_accent, title_part2, subtitle, cta_text, is_active, sort_order } = req.body;

  let imageUrl = existing.rows[0].image_url;
  if (req.file) {
    deleteImageFile(imageUrl);
    imageUrl = await processImage(req.file.buffer, 'hero');
  }

  const result = await query(
    `UPDATE hero_banners SET
       title_part1 = COALESCE($1, title_part1),
       title_accent = COALESCE($2, title_accent),
       title_part2 = COALESCE($3, title_part2),
       subtitle = COALESCE($4, subtitle),
       cta_text = COALESCE($5, cta_text),
       image_url = $6,
       is_active = COALESCE($7, is_active),
       sort_order = COALESCE($8, sort_order)
     WHERE id = $9 RETURNING *`,
    [
      title_part1 ?? null, title_accent ?? null, title_part2 ?? null,
      subtitle ?? null, cta_text ?? null, imageUrl,
      is_active !== undefined ? (is_active !== 'false' && is_active !== false) : null,
      sort_order !== undefined ? parseInt(sort_order, 10) : null,
      id,
    ]
  );
  await delPattern('cache:/api/hero*');
  res.json({ success: true, data: result.rows[0] });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM hero_banners WHERE id = $1 RETURNING image_url', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Banner not found');
  deleteImageFile(result.rows[0].image_url);
  await delPattern('cache:/api/hero*');
  res.json({ success: true, message: 'Banner deleted' });
});

module.exports = { getActiveBanners, getAdminBanners, createBanner, updateBanner, deleteBanner };
