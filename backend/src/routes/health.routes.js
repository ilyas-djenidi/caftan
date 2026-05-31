'use strict';

const router = require('express').Router();
const { pool } = require('../config/database');
const { isAvailable } = require('../config/redis');

router.get('/', async (req, res) => {
  let dbOk = false;
  try {
    await pool.query('SELECT 1');
    dbOk = true;
  } catch { /* */ }

  const status = dbOk ? 200 : 503;
  res.status(status).json({
    status: dbOk ? 'ok' : 'degraded',
    uptime: process.uptime(),
    database: dbOk ? 'connected' : 'error',
    cache: isAvailable() ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
