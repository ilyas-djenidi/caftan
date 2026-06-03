'use strict';

// 🚨 لا تستخدم dotenv هنا (يسبب تعارض مع injected env system)
// process.env يتم تحميله مسبقاً من النظام / dotenvx / hosting

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { pool } = require('./config/database');

// عدد العمال (workers)
const WORKERS =
  process.env.NODE_ENV === 'production'
    ? Math.min(os.cpus().length, 4)
    : 1;

// ─────────────────────────────────────────────
// CLUSTER MODE (production only)
// ─────────────────────────────────────────────
if (cluster.isPrimary && WORKERS > 1) {
  logger.info(`Master ${process.pid} starting ${WORKERS} workers`);

  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(
      `Worker ${worker.process.pid} died (${signal || code}), restarting...`
    );
    cluster.fork();
  });
} else {
  // ─────────────────────────────────────────────
  // START SERVER
  // ─────────────────────────────────────────────
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      `Worker ${process.pid} listening on port ${env.PORT} [${process.env.NODE_ENV}]`
    );
  });

  // ─────────────────────────────────────────────
  // GRACEFUL SHUTDOWN
  // ─────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);

    server.close(async () => {
      try {
        await pool.end();
        logger.info('DB pool closed');
      } catch (err) {
        logger.error('Error closing DB pool', {
          error: err.message,
        });
      }

      process.exit(0);
    });

    // force shutdown after 15s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15000);
  };

  // signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // errors
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', {
      error: err.message,
      stack: err.stack,
    });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', {
      reason: String(reason),
    });
  });
}