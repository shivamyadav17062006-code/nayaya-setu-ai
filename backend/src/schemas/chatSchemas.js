import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  language: z.string().trim().min(2).max(5).default('en'),
  sessionId: z.string().trim().optional(),
});

export const createConversationSchema = z.object({
  title: z.string().trim().max(200).optional(),
  language: z.string().trim().min(2).max(5).default('en'),
  sessionId: z.string().trim().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(200, 'Title cannot exceed 200 characters').optional(),
  language: z.string().trim().min(2).max(5).optional(),
});
