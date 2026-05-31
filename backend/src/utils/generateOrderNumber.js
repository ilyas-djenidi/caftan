'use strict';

const { query } = require('../config/database');

const pad = (n, len) => String(n).padStart(len, '0');

const generateOrderNumber = async () => {
  const result = await query(
    `SELECT COUNT(*) AS cnt FROM orders WHERE created_at >= date_trunc('day', NOW())`
  );
  const seq = parseInt(result.rows[0].cnt, 10) + 1;
  const part1 = pad(Math.floor(10000 + Math.random() * 89999), 5);
  const part2 = pad(seq % 1000, 3);
  return `#PKR-${part1}-${part2}`;
};

module.exports = generateOrderNumber;
