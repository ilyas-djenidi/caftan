'use strict';

const Redis = require('ioredis');
const env = require('./env');
const logger = require('../utils/logger');

const redisConfig = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  retryStrategy: (times) => {
    if (times > 5) {     
      // was 10 — give up faster on dead Redis
      logger.error('Redis: max reconnect attempts reached');
      return null;
      
    }
    return Math.min(times * 300, 3000);
  },
  reconnectOnError: (err) => {
    logger.warn('Redis reconnect on error', { error: err.message });
    return true;
  },
  maxRetriesPerRequest: 1,        // was 3 — fail fast, don't block requests
  enableOfflineQueue: false,      // was true — drop commands if disconnected
  lazyConnect: true,              // connect only when first command is sent
  commandTimeout: 2000,           // 2s max per command
};

let redis;
let isRedisAvailable = false;

try {
  redis = new Redis(redisConfig);
  redis.connect().catch(() => {});

  redis.on('connect', () => {
    isRedisAvailable = true;
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    isRedisAvailable = false;
    logger.warn('Redis error (non-fatal, caching disabled)', { error: err.message });
  });

  redis.on('close', () => {
    isRedisAvailable = false;
  });
} catch (err) {
  logger.warn('Redis init failed, running without cache', { error: err.message });
  redis = null;
  isRedisAvailable = false;
}

const get = async (key) => {
  if (!redis || !isRedisAvailable) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds = env.redis.cacheTTL) => {
  if (!redis || !isRedisAvailable) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { /* non-fatal */ }
};

const del = async (...keys) => {
  if (!redis || !isRedisAvailable) return;
  try {
    await redis.del(...keys);
  } catch { /* non-fatal */ }
};

const delPattern = async (pattern) => {
  if (!redis || !isRedisAvailable) return;
  try {
    // Use SCAN instead of KEYS to avoid blocking Redis on large keyspaces
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch { /* non-fatal */ }
};

module.exports = { redis, get, set, del, delPattern, isAvailable: () => isRedisAvailable };
