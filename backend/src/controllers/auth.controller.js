'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw ApiError.badRequest('Email and password are required');

  const result = await query(
    'SELECT id, email, name, role, password_hash, is_active FROM admins WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  const admin = result.rows[0];
  if (!admin || !admin.is_active) throw ApiError.unauthorized('Invalid credentials');

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) throw ApiError.unauthorized('Invalid credentials');

  await query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [admin.id]);

  const token = jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  res.json({
    success: true,
    token,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

const getMe = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, email, name, role FROM admins WHERE id = $1 AND is_active = TRUE',
    [req.admin.id]
  );
  if (!result.rows[0]) throw ApiError.unauthorized();
  res.json({ success: true, user: result.rows[0] });
});

module.exports = { login, getMe };
