'use strict';

const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { buildUrl } = require('../utils/buildUrl');

/**
 * GET /api/home
 * Returns everything the landing page needs in a single round-trip:
 *   - Hero settings (from site_settings)
 *   - Up to 8 caftans, 8 jellabas, 8 accessoires (with primary image)
 *   - Category counts
 */
const getHomeData = asyncHandler(async (req, res) => {
  const [settingsRes, productsRes, countRes] = await Promise.all([
    // 1. Hero content
    query(`SELECT value FROM site_settings WHERE key = 'hero_content'`),

    // 2. All storefront products in one query, newest first, limited per category
    // Uses ROW_NUMBER to pick top 8 per category — no separate queries
    query(`
      SELECT
        p.id, p.name_fr, p.name_ar, p.price, p.original_price,
        p.on_sale, p.category, p.stock_count, p.in_stock,
        p.featured, p.is_new, p.created_at,
        pi.image_url AS primary_image_url
      FROM (
        SELECT *,
          ROW_NUMBER() OVER (PARTITION BY category ORDER BY created_at DESC) AS rn
        FROM products
        WHERE is_visible = TRUE
          AND category IN ('caftans', 'jellabas', 'accessoires')
      ) p
      LEFT JOIN LATERAL (
        SELECT image_url
        FROM product_images
        WHERE product_id = p.id
        ORDER BY is_primary DESC, display_order ASC
        LIMIT 1
      ) pi ON TRUE
      WHERE p.rn <= 8
      ORDER BY p.category, p.created_at DESC
    `),

    // 3. Count totals per category concurrently
    query(`
      SELECT category, COUNT(*) AS total
      FROM products
      WHERE is_visible = TRUE AND category IN ('caftans', 'jellabas', 'accessoires')
      GROUP BY category
    `),
  ]);

  const categoryCounts = { caftans: 0, jellabas: 0, accessoires: 0 };
  for (const row of countRes.rows) categoryCounts[row.category] = parseInt(row.total, 10);

  // Group products by category and build image URLs
  const grouped = { caftans: [], jellabas: [], accessoires: [] };
  for (const row of productsRes.rows) {
    grouped[row.category]?.push({
      id: row.id, name_fr: row.name_fr, name_ar: row.name_ar,
      price: row.price, original_price: row.original_price,
      on_sale: row.on_sale, category: row.category,
      stock_count: row.stock_count, in_stock: row.in_stock,
      featured: row.featured, is_new: row.is_new, created_at: row.created_at,
      images: row.primary_image_url
        ? [{ image_url: buildUrl(row.primary_image_url), is_primary: true }]
        : [],
    });
  }

  res.json({
    success: true,
    data: {
      heroSettings: settingsRes.rows[0]?.value ?? null,
      categoryCounts,
      caftansProducts:     grouped.caftans,
      jellabasProducts:    grouped.jellabas,
      accessoiresProducts: grouped.accessoires,
    },
  });
});

module.exports = { getHomeData };
