'use strict';

const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const validatePromo = asyncHandler(async (req, res) => {
  const { code, total } = req.body;
  if (!code) throw ApiError.badRequest('Promo code is required');

  const result = await query(
    `SELECT * FROM promo_codes
     WHERE code = $1 AND is_active = TRUE
       AND (expires_at IS NULL OR expires_at > NOW())
       AND (max_uses IS NULL OR used_count < max_uses)`,
    [code.toUpperCase().trim()]
  );

  const promo = result.rows[0];
  if (!promo) throw ApiError.badRequest('Invalid or expired promo code');

  const orderTotal = parseFloat(total ?? 0);
  if (orderTotal < promo.min_order) {
    throw ApiError.badRequest(
      `Minimum order amount for this promo code is ${promo.min_order} DA`
    );
  }

  const discount =
    promo.type === 'percentage'
      ? (orderTotal * promo.value) / 100
      : promo.value;

  res.json({
    success: true,
    data: {
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount: Math.min(discount, orderTotal),
    },
  });
});

const getAdminPromos = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM promo_codes ORDER BY created_at DESC');
  res.json({ success: true, data: result.rows });
});

const createPromo = asyncHandler(async (req, res) => {
  const { code, type, value, min_order, max_uses, is_active, expires_at } = req.body;
  if (!code || !type || !value) throw ApiError.badRequest('code, type, value are required');

  const result = await query(
    `INSERT INTO promo_codes (code, type, value, min_order, max_uses, is_active, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      code.toUpperCase().trim(), type, parseFloat(value),
      parseFloat(min_order ?? 0),
      max_uses ? parseInt(max_uses, 10) : null,
      is_active !== false && is_active !== 'false',
      expires_at ?? null,
    ]
  );
  res.status(201).json({ success: true, data: result.rows[0] });
});

const updatePromo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { code, type, value, min_order, max_uses, is_active, expires_at } = req.body;

  const fields = [];
  const vals = [];
  let pi = 1;
  const set = (col, val) => { fields.push(`${col} = $${pi++}`); vals.push(val); };

  if (code !== undefined) set('code', code.toUpperCase().trim());
  if (type !== undefined) set('type', type);
  if (value !== undefined) set('value', parseFloat(value));
  if (min_order !== undefined) set('min_order', parseFloat(min_order));
  if (max_uses !== undefined) set('max_uses', max_uses ? parseInt(max_uses, 10) : null);
  if (is_active !== undefined) set('is_active', is_active !== false && is_active !== 'false');
  if (expires_at !== undefined) set('expires_at', expires_at || null);

  if (!fields.length) throw ApiError.badRequest('No fields to update');

  vals.push(id);
  const result = await query(
    `UPDATE promo_codes SET ${fields.join(', ')} WHERE id = $${pi} RETURNING *`,
    vals
  );
  if (!result.rows[0]) throw ApiError.notFound('Promo code not found');
  res.json({ success: true, data: result.rows[0] });
});

const deletePromo = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM promo_codes WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Promo code not found');
  res.json({ success: true, message: 'Promo code deleted' });
});

module.exports = { validatePromo, getAdminPromos, createPromo, updatePromo, deletePromo };
