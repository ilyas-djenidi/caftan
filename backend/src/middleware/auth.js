'use strict';

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired'));
    }
    next(ApiError.unauthorized('Invalid token'));
  }
};

module.exports = { authenticate };
