import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import {
  chatMessageSchema,
  createConversationSchema,
  updateConversationSchema,
} from '../schemas/chatSchemas.js';
import {
  handleChat,
  getDbStatus,
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  getChatHistory,
} from '../controllers/chatController.js';

const router = Router();

// Connectivity probe
router.get('/db-status', getDbStatus);

// Main conversational AI route
router.post('/', optionalAuth, validate(chatMessageSchema, 'body'), handleChat);

// Conversation management (Standard REST /api/chat/conversations)
router.get('/conversations', optionalAuth, listConversations);
router.post('/conversations', optionalAuth, validate(createConversationSchema, 'body'), createConversation);
router.get('/conversations/:id', optionalAuth, getConversation);
router.patch('/conversations/:id', optionalAuth, validate(updateConversationSchema, 'body'), updateConversation);
router.delete('/conversations/:id', optionalAuth, deleteConversation);

// Session aliases for direct frontend client compatibility (/api/chat/sessions)
router.get('/sessions', optionalAuth, listConversations);
router.post('/sessions', optionalAuth, validate(createConversationSchema, 'body'), createConversation);
router.get('/sessions/:id', optionalAuth, getConversation);
router.delete('/sessions/:id', optionalAuth, deleteConversation);

// Chat history endpoint
router.get('/history/:sessionId', optionalAuth, getChatHistory);

export default router;
