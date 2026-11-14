import { v4 as uuidv4 } from 'uuid';
import { prisma, isPrismaConfigured } from '../lib/prisma.js';
import { queryAIEngine } from '../services/aiService.js';

/**
 * POST /api/chat
 * 1. Validates and unpacks request body
 * 2. Retrieves or creates a Conversation record in PostgreSQL (graceful degradation if DB is offline)
 * 3. Stores user message
 * 4. Dispatches query to NyayaSaathi AI Engine (RAG) or Gemini
 * 5. Stores assistant reply
 * 6. Returns structured response with diagnostic awareness
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

    // 1. Attempt PostgreSQL persistence via Prisma (safe non-blocking)
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

        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: {
              sessionId: resolvedSessionId,
              language,
            },
            include: { messages: true },
          });
        }

        conversationId = conversation.id;

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: 'user',
            content: message,
            language,
          },
        });

        history = conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
      } catch (dbErr) {
        console.warn(
          `[ChatController] Database persistence offline: ${dbErr?.message?.slice(0, 100) || dbErr}. Chat running in stateless session mode.`
        );
      }
    }

    // 2. Query AI Engine / Gemini
    const aiResponse = await queryAIEngine({
      query: message,
      language,
      session_id: resolvedSessionId,
      history,
    });

    // 3. Save assistant reply to PostgreSQL if conversation record exists
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
      } catch (dbErr) {
        console.warn(
          `[ChatController] Assistant message logging skipped: ${dbErr?.message?.slice(0, 100) || dbErr}`
        );
      }
    }

    // 4. Return structured response
    const suggestedActions = aiResponse.nextSteps?.map((step) => ({
      label: step,
      type: 'RIGHTS',
      payload: { step },
    }));

    const response = {
      answer: aiResponse.answer,
      sessionId: resolvedSessionId,
      language: aiResponse.language ?? language,
      sources: aiResponse.sources,
      suggestedActions,
      nextSteps: aiResponse.nextSteps,
      engine: aiResponse.engine,
      degraded: aiResponse.degraded,
      warning: aiResponse.warning,
    };

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
}
