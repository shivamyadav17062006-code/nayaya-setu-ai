import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { queryAIEngine } from '../services/aiService';
import { ChatRequest, ChatResponse } from '../types/index';

const prisma = new PrismaClient();

/**
 * POST /api/chat
 * 1. Validates and unpacks request body
 * 2. Retrieves or creates a Conversation record (with offline fallback)
 * 3. Stores the user message
 * 4. Forwards to Gemini / AI engine
 * 5. Stores the assistant reply
 * 6. Returns structured response
 */
export async function handleChat(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { message, language = 'en', sessionId } = req.body as ChatRequest;
    const resolvedSessionId = sessionId ?? uuidv4();

    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let conversationId: string | null = null;

    // Attempt DB operations safely
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
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    } catch (dbErr: any) {
      console.warn('DB session logging skipped (DB offline):', dbErr.message);
    }

    // Forward to Gemini / AI engine
    const aiResponse = await queryAIEngine({
      query: message,
      language,
      session_id: resolvedSessionId,
      history,
    });

    // Attempt DB save for assistant response safely
    if (conversationId) {
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
      } catch (dbErr: any) {
        console.warn('DB response logging skipped (DB offline):', dbErr.message);
      }
    }

    const response: ChatResponse = {
      answer: aiResponse.answer,
      sessionId: resolvedSessionId,
      language: aiResponse.language ?? language,
      sources: aiResponse.sources,
    };

    res.status(200).json({ success: true, data: response });
  } catch (err) {
    next(err);
  }
}
