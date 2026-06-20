'use strict';

// 🔧 CRITICAL: Load dotenv FIRST
if (!process.env.DB_HOST) {
  require('dotenv').config();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { pool } = require('./config/database');

console.log('🚀 SERVER STARTED [PID: ' + process.pid + ']');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  env.db.host:', env.db.host);
console.log('  env.db.user:', env.db.user);
console.log('  env.db.database:', env.db.database);
console.log('  env.db.poolMax:', env.db.poolMax);

(async () => {
  // Verify DB connection before starting
  try {
    await pool.query('SELECT 1');
    logger.info('✓ DB connection verified');
  } catch (err) {
    logger.error('✗ DB connection FAILED:', { error: err.message });
    process.exit(1);
  }

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(`✓ Server listening on port ${env.PORT} [${process.env.NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      try {
        await pool.end();
        logger.info('DB pool closed');
      } catch (err) {
        logger.error('Error closing DB pool', { error: err.message });
      }
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });
})().catch((err) => {
  logger.error('Failed to start server:', { error: err.message });
  process.exit(1);
});