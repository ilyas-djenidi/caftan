'use strict';

const { query } = require('../config/database');
const { del } = require('../config/redis');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

const getSettings = asyncHandler(async (req, res) => {
  const result = await query('SELECT key, value FROM site_settings');
  const settings = {};
  for (const row of result.rows) settings[row.key] = row.value;
  res.json({ success: true, data: settings });
});

const getSetting = asyncHandler(async (req, res) => {
  const result = await query('SELECT key, value FROM site_settings WHERE key = $1', [req.params.key]);
  if (!result.rows[0]) throw ApiError.notFound('Setting not found');
  res.json({ success: true, data: result.rows[0] });
});

const upsertSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  const result = await query(
    `INSERT INTO site_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
     RETURNING *`,
    [key, JSON.stringify(value)]
  );
  await del(`cache:/api/settings/${key}`);
  await del('cache:/api/settings');
  res.json({ success: true, data: result.rows[0] });
});

module.exports = { getSettings, getSetting, upsertSetting };
