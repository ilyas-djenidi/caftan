'use strict';

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  min: env.db.poolMin,
  max: env.db.poolMax,
  idleTimeoutMillis: env.db.idleTimeout,
  statement_timeout: env.db.statementTimeout,
  connectionTimeoutMillis: 5000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  logger.debug('New DB connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error', { error: err.message });
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 2000) {
      logger.warn('Slow query detected', { duration, query: text });
    }
    return res;
  } catch (err) {
    logger.error('DB query error', { error: err.message, query: text });
    throw err;
  }
};

const getClient = () => pool.connect();

const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, getClient, transaction };
