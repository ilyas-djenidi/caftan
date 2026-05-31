'use strict';

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redis, isAvailable } = require('../config/redis');
const env = require('../config/env');

const makeStore = (prefix) => {
  if (isAvailable() && redis) {
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: `rl:${prefix}:`,
    });
  }
  return undefined; // falls back to in-memory
};

// Public endpoints — 300 req / 15 min per IP
const publicLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('pub'),
  message: { success: false, error: 'Too many requests, please try again later' },
  skipSuccessfulRequests: false,
});

// Admin endpoints — more generous
const adminLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.adminMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('adm'),
  message: { success: false, error: 'Too many requests' },
});

// Strict limiter for auth & order creation — 20 req / 15 min per IP
const strictLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore('strict'),
  message: { success: false, error: 'Too many attempts, please wait before trying again' },
});

module.exports = { publicLimiter, adminLimiter, strictLimiter };
