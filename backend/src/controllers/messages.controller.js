'use strict';

const { query } = require('../config/database');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const sendMessage = asyncHandler(async (req, res) => {
  const { full_name, email, phone, subject, message } = req.body;
  if (!full_name || !message) throw ApiError.badRequest('full_name and message are required');

  const result = await query(
    `INSERT INTO messages (full_name, email, phone, subject, message)
     VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [full_name.trim(), email ?? null, phone ?? null, subject ?? null, message.trim()]
  );
  res.status(201).json({ success: true, data: { id: result.rows[0].id } });
});

const getMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, parseInt(limit, 10));
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];
  let pi = 1;
  if (status) { conditions.push(`status = $${pi++}`); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(`SELECT COUNT(*) FROM messages ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limitNum, offset);
  const result = await query(
    `SELECT * FROM messages ${where}
     ORDER BY created_at DESC
     LIMIT $${pi} OFFSET $${pi + 1}`,
    params
  );
  res.json({
    success: true,
    data: result.rows,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const result = await query(
    "UPDATE messages SET status = 'read' WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Message not found');
  res.json({ success: true, data: result.rows[0] });
});

const updateMessageStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['unread', 'read', 'replied'].includes(status)) throw ApiError.badRequest('Invalid status');
  const result = await query(
    'UPDATE messages SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!result.rows[0]) throw ApiError.notFound('Message not found');
  res.json({ success: true, data: result.rows[0] });
});

const deleteMessage = asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM messages WHERE id = $1 RETURNING id', [req.params.id]);
  if (!result.rows[0]) throw ApiError.notFound('Message not found');
  res.json({ success: true, message: 'Message deleted' });
});

module.exports = { sendMessage, getMessages, markAsRead, updateMessageStatus, deleteMessage };
