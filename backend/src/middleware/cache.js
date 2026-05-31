'use strict';

const cache = require('../config/redis');

/**
 * Express middleware that serves cached JSON responses via Redis.
 * @param {number} ttl - Cache duration in seconds (default from env)
 * @param {function} [keyFn] - Optional function(req) => string for custom cache key
 */
const cacheMiddleware = (ttl, keyFn) => async (req, res, next) => {
  const key = keyFn ? keyFn(req) : `cache:${req.originalUrl}`;

  const cached = await cache.get(key);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.json(cached);
  }

  res.setHeader('X-Cache', 'MISS');

  // Monkey-patch res.json to also save into Redis
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 200 && body?.success !== false) {
      cache.set(key, body, ttl).catch(() => {});
    }
    return origJson(body);
  };

  next();
};

module.exports = cacheMiddleware;
