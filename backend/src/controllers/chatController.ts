import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { queryAIEngine } from '../services/aiService';
import { ChatRequest, ChatResponse } from '../types/index';

const prisma = new PrismaClient();

/**
 * POST /api/chat
 * 1. Validates and unpacks request body
 * 2. Retrieves or creates a Conversation record
 * 3. Stores the user message
 * 4. Forwards to Python AI engine
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

    // Resolve or create conversation
    const resolvedSessionId = sessionId ?? uuidv4();

    let conversation = await prisma.conversation.findUnique({
      where: { sessionId: resolvedSessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // Last 10 messages for context
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

    // Persist the user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
        language,
      },
    });

    // Build history for context
    const history = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Forward to AI engine
    const aiResponse = await queryAIEngine({
      query: message,
      language,
      session_id: resolvedSessionId,
      history,
    });

    // Persist the assistant response
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.answer,
        language: aiResponse.language ?? language,
        metadata: aiResponse.sources ? { sources: aiResponse.sources } : undefined,
      },
    });

    // Update conversation language if changed
    if (conversation.language !== language) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { language, updatedAt: new Date() },
      });
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
