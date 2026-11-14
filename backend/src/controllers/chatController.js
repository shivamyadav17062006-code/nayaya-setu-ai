import { v4 as uuidv4 } from 'uuid';
import { prisma, isPrismaConfigured, prismaConfigStatus } from '../lib/prisma.js';
import { queryAIEngine } from '../services/aiService.js';
import { createError } from '../middleware/errorHandler.js';

// ---------------------------------------------------------------------------
// POST /api/chat — Send message & get AI legal awareness response
// ---------------------------------------------------------------------------
export async function handleChat(req, res, next) {
  try {
    const { message, language = 'en', sessionId } = req.body || {};

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const resolvedSessionId = sessionId || uuidv4();
    const authenticatedUserId = req.user?.id || req.user?.userId || null;

    let history = [];
    let conversationId = null;
    let persisted = false;
    let dbStatus = prismaConfigStatus;
    let dbWarning = null;

    // ---- 1. Database session validation & persistence ---------------------
    if (isPrismaConfigured) {
      try {
        let conversation = await prisma.conversation.findUnique({
          where: { sessionId: resolvedSessionId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 10,
            },
          },
        });

        if (conversation) {
          // Ownership verification: if conversation belongs to another user, forbid access
          if (conversation.userId && authenticatedUserId && conversation.userId !== authenticatedUserId) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: You do not have permission to access or post to this conversation session.',
              code: 'FORBIDDEN_CONVERSATION_ACCESS',
            });
          }

          // Link unowned conversation to newly authenticated user
          if (authenticatedUserId && !conversation.userId) {
            conversation = await prisma.conversation.update({
              where: { id: conversation.id },
              data: { userId: authenticatedUserId },
              include: {
                messages: {
                  orderBy: { createdAt: 'asc' },
                  take: 10,
                },
              },
            });
          }
        } else {
          conversation = await prisma.conversation.create({
            data: {
              sessionId: resolvedSessionId,
              language,
              userId: authenticatedUserId,
            },
            include: { messages: true },
          });
        }

        conversationId = conversation.id;

        // Persist the user message
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message.trim(),
            language,
          },
        });

        // Recent history context for AI
        history = (conversation.messages || []).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        dbStatus = 'connected';
      } catch (dbErr) {
        const reason = dbErr?.message?.slice(0, 150) ?? String(dbErr);
        dbWarning = `Message answered but could not be persisted to the database (${reason}).`;
        console.warn(`[ChatController] DB write failed — continuing stateless: ${reason}`);
      }
    } else {
      dbWarning = prismaConfigStatus === 'placeholder'
        ? 'Database not configured: DATABASE_URL contains placeholder tokens. Chat history will not be saved.'
        : 'DATABASE_URL is not set. Chat history will not be saved.';
    }

    // ---- 2. AI Engine Query -----------------------------------------------
    let aiResponse;
    try {
      aiResponse = await queryAIEngine({
        query: message.trim(),
        language,
        session_id: resolvedSessionId,
        history,
      });
    } catch (aiErr) {
      console.error('[ChatController] AI generation error:', aiErr?.message);
      return next(createError(
        'AI legal reasoning engine is currently unreachable or encountered an error. Please try again.',
        502,
        'AI_SERVICE_UNAVAILABLE'
      ));
    }

    if (!aiResponse || !aiResponse.answer || aiResponse.answer.trim() === '') {
      return next(createError(
        'AI service failed to generate a valid response.',
        502,
        'AI_EMPTY_RESPONSE'
      ));
    }

    // ---- 3. Persist Assistant Reply ---------------------------------------
    if (conversationId && isPrismaConfigured) {
      try {
        await prisma.message.create({
          data: {
            conversationId,
            role: 'assistant',
            content: aiResponse.answer,
            language: aiResponse.language ?? language,
            metadata: aiResponse.sources ? { sources: aiResponse.sources } : undefined,
          },
        });
        persisted = true;
      } catch (dbErr) {
        const reason = dbErr?.message?.slice(0, 150) ?? String(dbErr);
        dbWarning = `AI response generated but could not be saved to history (${reason}).`;
        console.warn(`[ChatController] Assistant message logging skipped: ${reason}`);
      }
    }

    // ---- 4. Response Delivery ---------------------------------------------
    const suggestedActions = aiResponse.nextSteps?.map((step) => ({
      label: step,
      type: 'RIGHTS',
      payload: { step },
    }));

    res.status(200).json({
      success: true,
      data: {
        answer: aiResponse.answer,
        sessionId: resolvedSessionId,
        conversationId,
        language: aiResponse.language ?? language,
        sources: aiResponse.sources || [],
        suggestedActions: suggestedActions || [],
        nextSteps: aiResponse.nextSteps || [],
        engine: aiResponse.engine,
        degraded: aiResponse.degraded ?? false,
        warning: aiResponse.warning,
        persisted,
        dbStatus,
        dbWarning,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/conversations (and /api/chat/sessions) — List conversations
// ---------------------------------------------------------------------------
export async function listConversations(req, res, next) {
  try {
    if (!isPrismaConfigured) {
      return res.status(200).json({ success: true, data: [] });
    }

    const authenticatedUserId = req.user?.id || req.user?.userId || null;
    const { sessionId } = req.query;

    let where = {};
    if (authenticatedUserId) {
      where = { userId: authenticatedUserId };
    } else if (sessionId) {
      where = { sessionId };
    } else {
      // Unauthenticated client without sessionId cannot list private conversations
      return res.status(200).json({ success: true, data: [] });
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const data = conversations.map((c) => ({
      id: c.id,
      sessionId: c.sessionId,
      userId: c.userId,
      language: c.language,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      lastMessage: c.messages[0]?.content || null,
    }));

    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/chat/conversations — Explicitly create a new conversation
// ---------------------------------------------------------------------------
export async function createConversation(req, res, next) {
  try {
    if (!isPrismaConfigured) {
      return next(createError('Database offline — cannot create persistent conversation.', 503, 'DB_OFFLINE'));
    }

    const { sessionId, language = 'en' } = req.body || {};
    const resolvedSessionId = sessionId || uuidv4();
    const authenticatedUserId = req.user?.id || req.user?.userId || null;

    const existing = await prisma.conversation.findUnique({
      where: { sessionId: resolvedSessionId },
    });

    if (existing) {
      if (existing.userId && authenticatedUserId && existing.userId !== authenticatedUserId) {
        return res.status(403).json({ success: false, error: 'Forbidden: Session already claimed by another user.' });
      }
      return res.status(200).json({ success: true, data: existing });
    }

    const conversation = await prisma.conversation.create({
      data: {
        sessionId: resolvedSessionId,
        language,
        userId: authenticatedUserId,
      },
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildConversationLookup(id) {
  if (UUID_REGEX.test(id)) {
    return { OR: [{ id }, { sessionId: id }] };
  }
  return { sessionId: id };
}

// ---------------------------------------------------------------------------
// GET /api/chat/conversations/:id (and /api/chat/sessions/:id) — Retrieve details
// ---------------------------------------------------------------------------
export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    if (!isPrismaConfigured) {
      return next(createError('Database offline.', 503, 'DB_OFFLINE'));
    }

    const authenticatedUserId = req.user?.id || req.user?.userId || null;

    // Support lookup by UUID id or by string sessionId
    const conversation = await prisma.conversation.findFirst({
      where: buildConversationLookup(id),
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: `Conversation '${id}' not found.` });
    }

    // Ownership check: if private conversation, only owner can view
    if (conversation.userId && (!authenticatedUserId || conversation.userId !== authenticatedUserId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to view this conversation.',
        code: 'FORBIDDEN_CONVERSATION_ACCESS',
      });
    }

    res.status(200).json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/chat/conversations/:id — Update conversation attributes
// ---------------------------------------------------------------------------
export async function updateConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { language } = req.body || {};

    if (!isPrismaConfigured) {
      return next(createError('Database offline.', 503, 'DB_OFFLINE'));
    }

    const authenticatedUserId = req.user?.id || req.user?.userId || null;

    const conversation = await prisma.conversation.findFirst({
      where: buildConversationLookup(id),
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: `Conversation '${id}' not found.` });
    }

    if (conversation.userId && (!authenticatedUserId || conversation.userId !== authenticatedUserId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to modify this conversation.',
      });
    }

    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        ...(language ? { language } : {}),
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/chat/conversations/:id — Delete conversation and messages
// ---------------------------------------------------------------------------
export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    if (!isPrismaConfigured) {
      return next(createError('Database offline.', 503, 'DB_OFFLINE'));
    }

    const authenticatedUserId = req.user?.id || req.user?.userId || null;

    const conversation = await prisma.conversation.findFirst({
      where: buildConversationLookup(id),
    });

    if (!conversation) {
      return res.status(404).json({ success: false, error: `Conversation '${id}' not found.` });
    }

    if (conversation.userId && (!authenticatedUserId || conversation.userId !== authenticatedUserId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to delete this conversation.',
      });
    }

    await prisma.conversation.delete({
      where: { id: conversation.id },
    });

    res.status(200).json({
      success: true,
      message: 'Conversation and all associated messages deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/chat/history/:sessionId — Retrieve message history for a session
// ---------------------------------------------------------------------------
export async function getChatHistory(req, res, next) {
  return getConversation(req, res, next);
}

// ---------------------------------------------------------------------------
// GET /api/chat/db-status — Lightweight probe for PostgreSQL connectivity
// ---------------------------------------------------------------------------
export async function getDbStatus(_req, res) {
  const { checkPrismaConnection } = await import('../lib/prisma.js');
  const result = await checkPrismaConnection();
  return res.status(200).json({
    success: true,
    data: {
      configured: isPrismaConfigured,
      configStatus: prismaConfigStatus,
      ...result,
    },
  });
}
