'use strict';

const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getProductReviews = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, author_name, rating, content, created_at
     FROM reviews
     WHERE product_id = $1 AND status = 'approved'
     ORDER BY created_at DESC`,
    [req.params.productId]
  );
  res.json({ success: true, data: result.rows });
});

const createReview = asyncHandler(async (req, res) => {
  const { author_name, rating, content } = req.body;
  const { productId } = req.params;

  if (!author_name || !rating) throw ApiError.badRequest('author_name and rating are required');
  const r = parseInt(rating, 10);
  if (r < 1 || r > 5) throw ApiError.badRequest('Rating must be between 1 and 5');

  const prod = await query('SELECT id FROM products WHERE id = $1 AND is_visible = TRUE', [productId]);
  if (!prod.rows[0]) throw ApiError.notFound('Product not found');

  const result = await query(
    `INSERT INTO reviews (product_id, author_name, rating, content)
     VALUES ($1,$2,$3,$4) RETURNING id, author_name, rating, content, status, created_at`,
    [productId, author_name.trim(), r, content ?? null]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

const getAdminReviews = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let pi = 1;
  if (status) { conditions.push(`r.status = $${pi++}`); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(`SELECT COUNT(*) FROM reviews r ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limitNum, offset);
  const result = await query(
    `SELECT r.id, r.product_id, p.name_fr AS product_name,
            r.author_name, r.rating, r.content, r.status, r.created_at
     FROM reviews r
     LEFT JOIN products p ON p.id = r.product_id
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    params
  );
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const updateReviewStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Invalid status');
  }
  const result = await query(
    'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Review not found');
  res.json({ success: true, data: result.rows[0] });
});

const deleteReview = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Review not found');
  res.json({ success: true, message: 'Review deleted' });
});

module.exports = { getProductReviews, createReview, getAdminReviews, updateReviewStatus, deleteReview };
