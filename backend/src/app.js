'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const logger = require('./utils/logger');
const { publicLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

// ── Static files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images to be loaded cross-origin
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / server-to-server
    if (env.cors.allowedOrigins.includes(origin)) return cb(null, true);
    if (env.NODE_ENV !== 'production') return cb(null, true); // dev: allow all
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Compression ───────────────────────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── HTTP logging ──────────────────────────────────────────
const morganStream = { write: (msg) => logger.http(msg.trim()) };
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', { stream: morganStream }));


// ── Global rate limiter ───────────────────────────────────
app.use('/api', publicLimiter);

// ── Trust proxy (for nginx reverse proxy) ─────────────────
app.set('trust proxy', 1);

// ── Routes ────────────────────────────────────────────────
app.use('/api', require('./routes/index'));

// ── 404 ───────────────────────────────────────────────────
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
});

// ── Global error handler ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
