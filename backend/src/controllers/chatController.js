import { v4 as uuidv4 } from 'uuid';
import { prisma, isPrismaConfigured, prismaConfigStatus } from '../lib/prisma.js';
import { queryAIEngine } from '../services/aiService.js';

// ---------------------------------------------------------------------------
// POST /api/chat
// ---------------------------------------------------------------------------

/**
 * handleChat — main conversational endpoint.
 *
 * Flow:
 *   1. Validate & unpack request body.
 *   2. Attempt PostgreSQL persistence (Prisma) — graceful degradation when DB offline.
 *   3. Dispatch query to NyayaSaathi AI Engine (RAG) or Gemini.
 *   4. Persist assistant reply if conversation record exists.
 *   5. Return structured response with explicit `persisted` and `dbStatus` flags.
 *
 * Database failure is NEVER silently swallowed as a successful write.
 * Callers receive `persisted: false` and `dbStatus` so the UI can warn the user.
 */
export async function handleChat(req, res, next) {
  try {
    const { message, language = 'en', sessionId } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }

    const resolvedSessionId = sessionId ?? uuidv4();

    let history = [];
    let conversationId = null;
    let persisted = false;         // did this exchange get written to PostgreSQL?
    let dbStatus = prismaConfigStatus; // 'configured' | 'placeholder' | 'missing'
    let dbWarning = null;          // human-readable reason if not persisted

    // ---- 1. PostgreSQL persistence (non-blocking) --------------------------
    if (isPrismaConfigured) {
      try {
        // Retrieve or create the conversation record for this session.
        let conversation = await prisma.conversation.findUnique({
          where: { sessionId: resolvedSessionId },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 10,
            },
          },
        });

        const authenticatedUserId = req.user?.id || req.user?.userId || null;

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              sessionId: resolvedSessionId,
              language,
              userId: authenticatedUserId,
            },
            include: { messages: true },
          });
        } else if (authenticatedUserId && !conversation.userId) {
          // If conversation existed before authentication, link it to the authenticated user
          await prisma.conversation.update({
            where: { id: conversation.id },
            data: { userId: authenticatedUserId },
          });
        }

        conversationId = conversation.id;

        // Persist the user message.
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
            language,
          },
        });

        // Build the recent history context for the AI engine.
        history = conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        dbStatus = 'connected';
      } catch (dbErr) {
        const reason = dbErr?.message?.slice(0, 150) ?? String(dbErr);
        dbWarning = `Your message was answered but could not be saved to the database (${reason}). This session is stateless.`;
        console.warn(`[ChatController] DB write failed — running stateless: ${reason}`);
      }
    } else {
      // DATABASE_URL is a placeholder or missing — tell the UI clearly.
      dbWarning =
        prismaConfigStatus === 'placeholder'
          ? 'Database not configured: DATABASE_URL in backend/.env still contains placeholder tokens. Chat history will not be saved.'
          : 'DATABASE_URL is not set. Chat history will not be saved.';
    }

    // ---- 2. AI Engine / Gemini query --------------------------------------
    const aiResponse = await queryAIEngine({
      query: message,
      language,
      session_id: resolvedSessionId,
      history,
    });

    // ---- 3. Persist assistant reply ----------------------------------------
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
        persisted = true; // both user + assistant messages written successfully
      } catch (dbErr) {
        const reason = dbErr?.message?.slice(0, 150) ?? String(dbErr);
        dbWarning = `AI response generated but could not be saved (${reason}).`;
        console.warn(`[ChatController] Assistant message logging skipped: ${reason}`);
      }
    }

    // ---- 4. Build structured response -------------------------------------
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
        language: aiResponse.language ?? language,
        sources: aiResponse.sources,
        suggestedActions,
        nextSteps: aiResponse.nextSteps,
        engine: aiResponse.engine,
        degraded: aiResponse.degraded,
        warning: aiResponse.warning,
        // Persistence diagnostics — consumed by the frontend to show UI warnings.
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
// GET /api/chat/db-status
// ---------------------------------------------------------------------------

/**
 * Lightweight endpoint for the frontend to query live database connectivity.
 * Does not perform any application-level DB reads.
 */
export async function getDbStatus(req, res) {
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
