'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ success: false, error: 'Unexpected file field' });
  }

  // Postgres constraint violations
  if (err.code === '23505') {
    const match = err.detail?.match(/\((.+)\)=\((.+)\)/);
    const field = match?.[1] ?? 'field';
    return res.status(409).json({ success: false, error: `Duplicate value for ${field}` });
  }
  if (err.code === '23503') {
    return res.status(409).json({ success: false, error: 'Referenced record does not exist' });
  }
  if (err.code === '23514') {
    return res.status(400).json({ success: false, error: 'Constraint violation: ' + (err.constraint ?? '') });
  }

  // Operational API errors
  if (err instanceof ApiError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Unknown errors — log and hide details in production
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  res.status(500).json({ success: false, error: message });
};

module.exports = errorHandler;
