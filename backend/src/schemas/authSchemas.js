import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid phone number format').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  language: z.string().trim().min(2).max(5).default('en'),
}).refine((data) => Boolean(data.email || data.phone), {
  message: 'Either email or phone number is required for registration.',
  path: ['email'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(1, 'Password is required'),
}).refine((data) => Boolean(data.email || data.phone), {
  message: 'Either email or phone number is required to log in.',
  path: ['email'],
});
