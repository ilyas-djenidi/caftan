'use strict';

// 🔧 CRITICAL: Load dotenv FIRST in every process (master + workers)
if (!process.env.DB_HOST) {
  require('dotenv').config();
}

console.log("🚀 SERVER FILE STARTED [PID: " + process.pid + "]");
console.log("  NODE_ENV before:", process.env.NODE_ENV);

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const cluster = require('cluster');
const os = require('os');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { pool } = require('./config/database');

// 📊 Environment diagnostics
console.log("  NODE_ENV after:", process.env.NODE_ENV);
console.log("  env.db.host:", env.db.host);
console.log("  env.db.user:", env.db.user);
console.log("  env.db.database:", env.db.database);
console.log("  env.db.poolMax:", env.db.poolMax);

// عدد العمال (workers)
const WORKERS =
  process.env.NODE_ENV === 'production'
    ? Math.min(os.cpus().length, 4)
    : 1;

// ─────────────────────────────────────────────
// CLUSTER MODE (production only)
// ─────────────────────────────────────────────
if (cluster.isPrimary && WORKERS > 1) {
  console.log("🧠 MASTER PROCESS [PID: " + process.pid + "]");
  logger.info(`Master ${process.pid} starting ${WORKERS} workers`);
  
  // ✅ Verify DB connection in master before spawning workers
  (async () => {
    try {
      const res = await pool.query('SELECT 1');
      logger.info('✓ Master verified DB connection before workers');
    } catch (err) {
      logger.error('✗ Master DB connection FAILED before workers:', { error: err.message });
      logger.error('  This likely means environment variables are not loaded correctly');
      process.exit(1);
    }
  })();

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
  console.log("🟢 WORKER PROCESS [PID: " + process.pid + "]");
  
  // ✅ Verify DB connection in each worker
  (async () => {
    try {
      const res = await pool.query('SELECT 1');
      logger.info('✓ Worker verified DB connection');
    } catch (err) {
      logger.error('✗ Worker DB connection FAILED:', { error: err.message });
      process.exit(1);
    }
  })();
  
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