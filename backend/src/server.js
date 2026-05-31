'use strict';

require('dotenv').config();

const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { pool } = require('./config/database');

const WORKERS = env.NODE_ENV === 'production'
  ? Math.min(os.cpus().length, 4) // cap at 4 workers
  : 1;

// ── Cluster mode (production only) ───────────────────────
if (cluster.isPrimary && WORKERS > 1) {
  logger.info(`Master ${process.pid} starting ${WORKERS} workers`);

  for (let i = 0; i < WORKERS; i++) cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (${signal || code}), restarting...`);
    cluster.fork();
  });
} else {
  const server = app.listen(env.PORT, () => {
    logger.info(`Worker ${process.pid} listening on port ${env.PORT} [${env.NODE_ENV}]`);
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

    // Force exit after 15s if connections don't close
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15_000);
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
}
