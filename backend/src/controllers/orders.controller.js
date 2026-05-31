'use strict';

const { query, transaction } = require('../config/database');
const generateOrderNumber = require('../utils/generateOrderNumber');
const { sendOrderNotification } = require('../services/notifications.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ── Create order (public) ─────────────────────────────────────

const createOrder = asyncHandler(async (req, res) => {
  const {
    first_name, last_name, phone, wilaya, commune,
    address, notes, items = [], delivery_type = 'home',
    promo_code, delivery_fee = 0,
  } = req.body;

  if (!phone || !wilaya || !commune) {
    throw ApiError.badRequest('phone, wilaya, and commune are required');
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('Order must contain at least one item');
  }

  let discountAmount = 0;
  let promoRow = null;

  // Validate promo code if provided
  if (promo_code) {
    const promoRes = await query(
      `SELECT * FROM promo_codes
       WHERE code = $1 AND is_active = TRUE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [promo_code.toUpperCase().trim()]
    );
    promoRow = promoRes.rows[0];
    if (!promoRow) throw ApiError.badRequest('Invalid or expired promo code');
  }

  const order = await transaction(async (client) => {
    const orderNumber = await generateOrderNumber();

    // Verify stock and calculate items total
    let itemsTotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      if (item.pack_id) {
        const pack = await client.query(
          'SELECT id, name_fr, price, is_active, is_sold_out, image_url FROM packs WHERE id = $1',
          [item.pack_id]
        );
        if (!pack.rows[0] || !pack.rows[0].is_active || pack.rows[0].is_sold_out) {
          throw ApiError.badRequest(`Pack "${item.pack_id}" is unavailable`);
        }
        const p = pack.rows[0];
        const qty = Math.max(1, parseInt(item.quantity ?? 1, 10));
        itemsTotal += p.price * qty;
        resolvedItems.push({
          pack_id: p.id,
          product_id: null,
          product_name: p.name_fr,
          product_image: p.image_url,
          quantity: qty,
          size: null,
          color: null,
          price_at_purchase: p.price,
        });
      } else {
        const prod = await client.query(
          'SELECT id, name_fr, price, stock_count FROM products WHERE id = $1 AND is_visible = TRUE',
          [item.product_id]
        );
        if (!prod.rows[0]) {
          throw ApiError.badRequest(`Product "${item.product_id}" not found`);
        }
        const p = prod.rows[0];
        const qty = Math.max(1, parseInt(item.quantity ?? 1, 10));
        if (p.stock_count < qty) {
          throw ApiError.badRequest(`Insufficient stock for "${p.name_fr}"`);
        }
        const imageRes = await client.query(
          'SELECT image_url FROM product_images WHERE product_id = $1 AND is_primary = TRUE LIMIT 1',
          [p.id]
        );
        itemsTotal += p.price * qty;
        resolvedItems.push({
          product_id: p.id,
          pack_id: null,
          product_name: p.name_fr,
          product_image: imageRes.rows[0]?.image_url ?? null,
          quantity: qty,
          size: item.size ?? null,
          color: item.color ?? null,
          price_at_purchase: p.price,
        });

        // Decrement stock
        await client.query(
          'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2',
          [qty, p.id]
        );
      }
    }

    // Apply promo
    if (promoRow) {
      if (itemsTotal < promoRow.min_order) {
        throw ApiError.badRequest(
          `Minimum order amount for this promo is ${promoRow.min_order} DA`
        );
      }
      discountAmount =
        promoRow.type === 'percentage'
          ? (itemsTotal * promoRow.value) / 100
          : promoRow.value;
      discountAmount = Math.min(discountAmount, itemsTotal);
      await client.query(
        'UPDATE promo_codes SET used_count = used_count + 1 WHERE id = $1',
        [promoRow.id]
      );
    }

    const totalPrice = Math.max(0, itemsTotal - discountAmount + parseFloat(delivery_fee));

    const ins = await client.query(
      `INSERT INTO orders
         (order_number, first_name, last_name, customer_name, phone,
          wilaya, commune, address, notes, total_price, delivery_fee,
          delivery_type, promo_code, discount_amount)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        orderNumber,
        first_name ?? null,
        last_name ?? null,
        `${first_name ?? ''} ${last_name ?? ''}`.trim() || null,
        phone, wilaya, commune,
        address ?? null, notes ?? null,
        totalPrice, parseFloat(delivery_fee),
        delivery_type,
        promoRow ? promoRow.code : null,
        discountAmount,
      ]
    );
    const createdOrder = ins.rows[0];

    for (const item of resolvedItems) {
      await client.query(
        `INSERT INTO order_items
           (order_id, product_id, pack_id, product_name, product_image,
            quantity, size, color, price_at_purchase)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          createdOrder.id, item.product_id, item.pack_id,
          item.product_name, item.product_image,
          item.quantity, item.size, item.color, item.price_at_purchase,
        ]
      );
    }

    return { order: createdOrder, items: resolvedItems };
  });

  // Fire-and-forget webhook
  sendOrderNotification(order.order, order.items);

  res.status(201).json({
    success: true,
    data: { order_number: order.order.order_number, id: order.order.id },
  });
});

// ── Admin list ────────────────────────────────────────────────

const getAdminOrders = asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, status, guepex_status, search,
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let pi = 1;

  if (status) { conditions.push(`o.status = $${pi++}`); params.push(status); }
  if (guepex_status) { conditions.push(`o.guepex_status = $${pi++}`); params.push(guepex_status); }
  if (search) {
    conditions.push(
      `(o.order_number ILIKE $${pi} OR o.phone ILIKE $${pi} OR o.customer_name ILIKE $${pi})`
    );
    params.push(`%${search}%`); pi++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countRes = await query(`SELECT COUNT(*) FROM orders o ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limitNum, offset);
  const dataRes = await query(
    `SELECT o.id, o.order_number, o.customer_name, o.first_name, o.last_name,
            o.phone, o.wilaya, o.commune, o.total_price, o.status,
            o.guepex_tracking, o.guepex_status, o.delivery_type,
            o.promo_code, o.discount_amount, o.created_at
     FROM orders o ${where}
     ORDER BY o.created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    params
  );

  res.json({
    success: true,
    data: dataRes.rows,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

// ── Single order (admin) ──────────────────────────────────────

const getOrderById = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Order not found');

  const items = await query(
    'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
    [req.params.id]
  );

  res.json({ success: true, data: { ...result.rows[0], items: items.rows } });
});

// ── Update status ─────────────────────────────────────────────

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const VALID = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!VALID.includes(status)) throw ApiError.badRequest('Invalid status');

  const result = await query(
    'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: result.rows[0] });
});

// ── Update Guepex fields ──────────────────────────────────────

const updateOrderGuepex = asyncHandler(async (req, res) => {
  const { guepex_tracking, guepex_tracking_id, guepex_status } = req.body;
  const result = await query(
    `UPDATE orders SET
       guepex_tracking    = COALESCE($1, guepex_tracking),
       guepex_tracking_id = COALESCE($2, guepex_tracking_id),
       guepex_status      = COALESCE($3, guepex_status),
       updated_at         = NOW()
     WHERE id = $4 RETURNING *`,
    [guepex_tracking ?? null, guepex_tracking_id ?? null, guepex_status ?? null, req.params.id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Order not found');
  res.json({ success: true, data: result.rows[0] });
});

// ── Delete order ──────────────────────────────────────────────

const deleteOrder = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM orders WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Order not found');
  res.json({ success: true, message: 'Order deleted' });
});

// ── Orders with tracking (for expeditions page) ───────────────

const getShippedOrders = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT id, order_number, customer_name, phone, wilaya, commune,
            total_price, status, guepex_tracking, guepex_tracking_id, guepex_status, created_at
     FROM orders
     WHERE guepex_tracking IS NOT NULL
     ORDER BY created_at DESC
     LIMIT 500`
  );
  res.json({ success: true, data: result.rows });
});

// ── Delivery stats by guepex_status ──────────────────────────

const getDeliveryStats = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT guepex_status, COUNT(*) AS count
     FROM orders
     WHERE guepex_status IS NOT NULL
     GROUP BY guepex_status`
  );
  const stats = {};
  for (const row of result.rows) stats[row.guepex_status] = parseInt(row.count, 10);
  res.json({ success: true, data: stats });
});

module.exports = {
  createOrder, getAdminOrders, getOrderById,
  updateOrderStatus, updateOrderGuepex,
  deleteOrder, getShippedOrders, getDeliveryStats,
};
