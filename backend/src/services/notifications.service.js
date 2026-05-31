'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

const sendOrderNotification = async (order, items) => {
  if (!env.n8n.webhookUrl) return;
  try {
    await axios.post(
      env.n8n.webhookUrl,
      {
        order_number: order.order_number,
        customer: {
          name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || order.customer_name,
          phone: order.phone,
          wilaya: order.wilaya,
          commune: order.commune,
          address: order.address,
        },
        items: items.map((i) => ({
          name: i.product_name,
          qty: i.quantity,
          size: i.size,
          color: i.color,
          price: i.price_at_purchase,
        })),
        total: order.total_price,
        delivery_type: order.delivery_type,
        promo_code: order.promo_code,
      },
      { timeout: 8000 }
    );
  } catch (err) {
    // Non-fatal — log and continue
    logger.warn('n8n webhook failed', { error: err.message, order: order.order_number });
  }
};

module.exports = { sendOrderNotification };
