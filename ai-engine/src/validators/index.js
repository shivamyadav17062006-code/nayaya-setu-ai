import { z } from 'zod';

export const querySchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  language: z.string().trim().min(2).max(10).default('en'),
  intent: z.string().trim().optional().nullable(),
  session_id: z.string().trim().optional().nullable(),
  history: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ).optional().default([]),
});

export const embedSchema = z.object({
  content: z.string().trim().min(1, 'Content string is required for vector embedding'),
  section_id: z.string().trim().optional().nullable(),
  language: z.string().trim().default('en'),
  metadata: z.record(z.any()).optional().default({}),
});

export const detectLanguageSchema = z.object({
  text: z.string().trim().min(1, 'Text is required for language detection'),
});

export const translateSchema = z.object({
  text: z.string().trim().min(1, 'Text is required for translation'),
  target_language: z.string().trim().min(2).max(10),
  source_language: z.string().trim().min(2).max(10).optional().default('en'),
});
