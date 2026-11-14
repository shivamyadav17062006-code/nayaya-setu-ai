import { z } from 'zod';

export const eligibilityCheckSchema = z.object({
  income: z.coerce.number().min(0, 'Income cannot be negative').optional().nullable(),
  annualIncome: z.coerce.number().min(0, 'Income cannot be negative').optional().nullable(),
  state: z.string().trim().optional().default('Delhi'),
  courtLevel: z.enum(['SUBORDINATE_COURT', 'HIGH_COURT', 'SUPREME_COURT']).optional().default('SUBORDINATE_COURT'),
  category: z.string().trim().optional().default('GENERAL'),
  beneficiaryType: z.string().trim().optional().default('GENERAL'),
  circumstances: z.union([z.array(z.string()), z.string()]).optional().default([]),
  age: z.coerce.number().int().min(0).max(150).optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  situation: z.string().trim().optional(),
  userConsent: z.boolean().optional().default(false),
});
