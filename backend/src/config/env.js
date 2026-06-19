'use strict';

const required = (name) => {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
};

const optional = (name, fallback) => process.env[name] ?? fallback;

// 📋 Debug: Print what we loaded
if (process.env.DEBUG) {
  console.log('✓ env.js loaded:');
  console.log('  DB_HOST:', process.env.DB_HOST || '(not set)');
  console.log('  DB_USER:', process.env.DB_USER || '(not set)');
  console.log('  DB_NAME:', process.env.DB_NAME || '(not set)');
}

module.exports = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '4000'), 10),
  BASE_URL: optional('BASE_URL', 'http://localhost:4000'),

  db: {
    host: optional('DB_HOST', '127.0.0.1'),
    port: parseInt(optional('DB_PORT', '5432'), 10),
    database: optional('DB_NAME', 'caftan_db'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', ''),
    poolMin: parseInt(optional('DB_POOL_MIN', '2'), 10),
    poolMax: parseInt(optional('DB_POOL_MAX', '20'), 10),
    idleTimeout: parseInt(optional('DB_POOL_IDLE_TIMEOUT', '30000'), 10),
    statementTimeout: parseInt(optional('DB_STATEMENT_TIMEOUT', '15000'), 10),
  },

  redis: {
    host: optional('REDIS_HOST', '127.0.0.1'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
    password: optional('REDIS_PASSWORD', '') || undefined,
    cacheTTL: parseInt(optional('CACHE_TTL', '300'), 10),
  },

  jwt: {
    secret: optional('JWT_SECRET', 'dev_secret_change_in_production'),
    expiresIn: optional('JWT_EXPIRES_IN', '7d'),
  },

  cors: {
    allowedOrigins: optional('ALLOWED_ORIGINS', 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  guepex: {
    apiId: optional('GUEPEX_API_ID', ''),
    apiToken: optional('GUEPEX_API_TOKEN', ''),
    baseUrl: optional('GUEPEX_BASE_URL', 'https://api.guepex.app'),
  },

  store: {
    wilaya: optional('STORE_WILAYA', "M'Sila"),
    commune: optional('STORE_COMMUNE', 'Berhoum'),
    wilayaId: parseInt(optional('STORE_WILAYA_ID', '28'), 10),
    communeId: parseInt(optional('STORE_COMMUNE_ID', '2810'), 10),
  },

  n8n: {
    webhookUrl: optional('N8N_WEBHOOK_URL', ''),
  },

  upload: {
    maxFileSizeMb: parseInt(optional('UPLOAD_MAX_FILE_SIZE_MB', '10'), 10),
    webpQuality: parseInt(optional('UPLOAD_WEBP_QUALITY', '82'), 10),
    maxWidth: parseInt(optional('UPLOAD_MAX_WIDTH', '1920'), 10),
  },

  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX_REQUESTS', '300'), 10),
    adminMax: parseInt(optional('RATE_LIMIT_ADMIN_MAX', '500'), 10),
  },
};
