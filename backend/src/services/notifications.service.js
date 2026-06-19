'use strict';

const axios = require('axios');
const env = require('../config/env');
const logger = require('../utils/logger');

// Map of hex color codes → French color names (common fashion colors)
const HEX_TO_COLOR_NAME = {
  '#FFFFFF': 'Blanc',
  '#000000': 'Noir',
  '#FF0000': 'Rouge',
  '#CC0000': 'Rouge foncé',
  '#FF6666': 'Rouge clair',
  '#FFC0CB': 'Rose',
  '#FF69B4': 'Rose vif',
  '#FF1493': 'Rose fuchsia',
  '#FFB6C1': 'Rose pâle',
  '#C71585': 'Rose foncé',
  '#800000': 'Bordeaux',
  '#8B0000': 'Rouge bordeaux',
  '#FFA500': 'Orange',
  '#FF8C00': 'Orange foncé',
  '#FFFF00': 'Jaune',
  '#FFD700': 'Or',
  '#F5DEB3': 'Blé',
  '#FAEBD7': 'Crème',
  '#F5F5DC': 'Beige',
  '#D2B48C': 'Beige foncé',
  '#C3AB7E': 'Doré',
  '#B8963E': 'Doré foncé',
  '#008000': 'Vert',
  '#006400': 'Vert foncé',
  '#90EE90': 'Vert clair',
  '#2E8B57': 'Vert émeraude',
  '#3CB371': 'Vert menthe',
  '#0000FF': 'Bleu',
  '#0000CD': 'Bleu foncé',
  '#000080': 'Marine',
  '#1E3A5F': 'Bleu marine',
  '#4169E1': 'Bleu royal',
  '#87CEEB': 'Bleu ciel',
  '#ADD8E6': 'Bleu clair',
  '#00FFFF': 'Cyan',
  '#800080': 'Violet',
  '#8B008B': 'Violet foncé',
  '#DDA0DD': 'Violet clair',
  '#EE82EE': 'Mauve',
  '#E6E6FA': 'Lavande',
  '#808080': 'Gris',
  '#A9A9A9': 'Gris clair',
  '#696969': 'Gris foncé',
  '#D3D3D3': 'Gris pâle',
  '#A52A2A': 'Marron',
  '#8B4513': 'Marron foncé',
  '#DEB887': 'Caramel',
  '#CD853F': 'Noisette',
  '#F0E68C': 'Kaki clair',
  '#BDB76B': 'Kaki',
  '#556B2F': 'Kaki foncé',
  '#40E0D0': 'Turquoise',
  '#00CED1': 'Turquoise foncé',
  '#20B2AA': 'Vert d\'eau',
  '#FFFFF0': 'Ivoire',
  '#FAF0E6': 'Lin',
  '#FFF5EE': 'Écru',
};

/**
 * Convert a hex color code to a human-readable French color name.
 * Falls back to the original value if no match is found.
 */
const hexToColorName = (color) => {
  if (!color) return color;
  const upper = color.toUpperCase().trim();
  return HEX_TO_COLOR_NAME[upper] || color;
};

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
          product_name: i.product_name,
          quantity: i.quantity,
          size: i.size,
          color: hexToColorName(i.color),   // convert #RRGGBB → "Blanc", "Noir", etc.
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
