'use strict';

const router = require('express').Router();
const { pool } = require('../config/database');
const { isAvailable } = require('../config/redis');
const logger = require('../utils/logger');

router.get('/', async (req, res) => {
  let dbOk = false;
  let dbError = null;
  try {
    const result = await pool.query('SELECT NOW() as timestamp');
    dbOk = true;
    logger.debug('✓ Health check: DB OK', { rows: result.rows.length });
  } catch (err) {
    dbError = err.message;
    logger.warn('✗ Health check: DB failed', { error: err.message, code: err.code });
  }

  const cacheOk = isAvailable();
  const status = dbOk ? 'ok' : 'degraded';
  const httpStatus = dbOk ? 200 : 503;

  res.status(httpStatus).json({
    status,
    uptime: process.uptime(),
    pid: process.pid,
    database: dbOk ? 'connected' : `error: ${dbError}`,
    cache: cacheOk ? 'connected' : 'unavailable',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
