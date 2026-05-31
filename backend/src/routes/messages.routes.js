'use strict';

const router = require('express').Router();
const { sendMessage, getMessages, markAsRead, updateMessageStatus, deleteMessage } = require('../controllers/messages.controller');
const { authenticate } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');

router.post('/', strictLimiter, sendMessage);

router.get('/', authenticate, getMessages);
router.put('/:id/read', authenticate, markAsRead);
router.put('/:id/status', authenticate, updateMessageStatus);
router.delete('/:id', authenticate, deleteMessage);

module.exports = router;
