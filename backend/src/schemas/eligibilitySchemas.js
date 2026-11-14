import { z } from 'zod';

export const eligibilityCheckSchema = z.object({
  income: z.coerce.number().min(0, 'Income cannot be negative').default(0),
  state: z.string().trim().min(1, 'State is required').default('Delhi'),
  category: z.string().trim().min(1, 'Category is required').default('GENERAL'),
  beneficiaryType: z.string().trim().min(1, 'Beneficiary type is required').default('GENERAL'),
  age: z.coerce.number().int().min(0).max(150).optional(),
  gender: z.string().trim().optional(),
});
