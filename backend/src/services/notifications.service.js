'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const sendOrderNotification = async (order, items) => {
  if (!env.n8n.webhookUrl) return;

  const customerName = `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.customer_name || '';

  try {
    await axios.post(
      env.n8n.webhookUrl,
      {
        order_number: order.order_number,
        // Exact field names expected by n8n Telegram workflow
        customer_name: customerName,
        customer_phone: order.phone,
        wilaya: order.wilaya,
        city: order.commune,          // n8n uses "city", DB stores as "commune"
        address: order.address || '',
        total: order.total_price,
        delivery_type: order.delivery_type,
        delivery_fee: order.delivery_fee,
        promo_code: order.promo_code || null,
        items: items.map((i) => ({
          product_name: i.product_name, // n8n uses product_name
          quantity: i.quantity,          // n8n uses quantity
          size: i.size,
          color: i.color,
          price: i.price_at_purchase,
        })),
      },
      { timeout: 8000 }
    );
  } catch (err) {
    // Non-fatal — log and continue
    logger.warn('n8n webhook failed', { error: err.message, order: order.order_number });
  }
};

module.exports = { sendOrderNotification };

