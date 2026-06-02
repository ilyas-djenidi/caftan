'use strict';

const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    todayOrders,
    pendingOrders,
    monthRevenue,
    unreadMessages,
    productsCount,
    lowStockProducts,
    sevenDayChart,
    recentOrders,
  ] = await Promise.all([
    query(`SELECT COUNT(*) FROM orders WHERE created_at >= date_trunc('day', NOW())`),

    query(`SELECT COUNT(*) FROM orders WHERE status = 'pending'`),

    query(`SELECT COALESCE(SUM(total_price), 0) AS revenue
           FROM orders
           WHERE status NOT IN ('cancelled')
             AND created_at >= date_trunc('month', NOW())`),

    query(`SELECT COUNT(*) FROM messages WHERE status = 'unread'`),

    query(`SELECT COUNT(*) FROM products WHERE is_visible = TRUE`),

    query(`SELECT id, name_fr, stock_count, category
           FROM products
           WHERE stock_count <= 5 AND is_visible = TRUE
           ORDER BY stock_count ASC
           LIMIT 10`),

    query(`SELECT
             to_char(d.d, 'YYYY-MM-DD') AS date,
             COUNT(o.id)               AS orders,
             COALESCE(SUM(o.total_price), 0) AS revenue
           FROM generate_series(
             date_trunc('day', NOW() - INTERVAL '6 days'),
             date_trunc('day', NOW()),
             INTERVAL '1 day'
           ) AS d(d)
           LEFT JOIN orders o
             ON o.created_at >= d.d
             AND o.created_at < d.d + INTERVAL '1 day'
             AND o.status <> 'cancelled'
           GROUP BY d.d
           ORDER BY d.d`),

    query(`SELECT id, order_number, customer_name, phone, total_price, status, created_at
           FROM orders
           ORDER BY created_at DESC
           LIMIT 5`),
  ]);

  res.json({
    success: true,
    data: {
      today_orders: parseInt(todayOrders.rows[0].count, 10),
      pending_orders: parseInt(pendingOrders.rows[0].count, 10),
      month_revenue: parseFloat(monthRevenue.rows[0].revenue),
      unread_messages: parseInt(unreadMessages.rows[0].count, 10),
      products_count: parseInt(productsCount.rows[0].count, 10),
      low_stock: lowStockProducts.rows,
      chart_7d: sevenDayChart.rows,
      recent_orders: recentOrders.rows,
    },
  });
});

/**
 * GET /api/stats/counts
 * Returns pending orders, unread messages, pending reviews in a SINGLE query.
 * Replaces 3 polling requests from the admin sidebar.
 */
const getAdminCounts = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT
      (SELECT COUNT(*) FROM orders  WHERE status = 'pending')          AS orders,
      (SELECT COUNT(*) FROM messages WHERE status = 'unread')          AS messages,
      (SELECT COUNT(*) FROM reviews  WHERE status = 'pending')         AS reviews
  `);
  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      orders:   parseInt(row.orders,   10),
      messages: parseInt(row.messages, 10),
      reviews:  parseInt(row.reviews,  10),
    },
  });
});

module.exports = { getDashboardStats, getAdminCounts };
