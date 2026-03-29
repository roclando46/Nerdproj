import { z } from 'zod';

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  memberId: z.string().optional(),
  status: z.string().optional(),
});

export const IdParamSchema = z.object({ id: z.string().min(1) });

// ─── DBS Schemas ─────────────────────────────────────────────────────────────

export const CreateDBSRecordSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  certificateNumber: z.string().max(30).optional(),
  checkDate: z.string().datetime({ message: 'Invalid check date' }),
  expiryDate: z.string().datetime({ message: 'Invalid expiry date' }).optional(),
  checkType: z.enum(['BASIC', 'STANDARD', 'ENHANCED']).default('ENHANCED'),
  status: z.enum(['NOT_REQUIRED', 'PENDING', 'VALID', 'EXPIRED', 'FLAGGED']).default('PENDING'),
  issuedBy: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateDBSRecordSchema = CreateDBSRecordSchema.omit({ memberId: true }).partial();

// ─── Training Schemas ─────────────────────────────────────────────────────────

export const CreateTrainingRecordSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  trainingType: z.enum([
    'SAFE_HANDS',
    'WELFARE_OFFICER',
    'FIRST_AID',
    'COACHING_LEVEL_1',
    'COACHING_LEVEL_2',
    'DBS_AWARENESS',
    'CUSTOM',
  ]),
  customTypeName: z.string().max(100).optional(),
  completedAt: z.string().datetime({ message: 'Invalid completion date' }),
  expiryDate: z.string().datetime({ message: 'Invalid expiry date' }).optional(),
  provider: z.string().max(200).optional(),
  certificateRef: z.string().max(100).optional(),
});

export const UpdateTrainingRecordSchema = CreateTrainingRecordSchema.omit({
  memberId: true,
}).partial();

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListQuery = z.infer<typeof ListQuerySchema>;
export type CreateDBSRecordInput = z.infer<typeof CreateDBSRecordSchema>;
export type UpdateDBSRecordInput = z.infer<typeof UpdateDBSRecordSchema>;
export type CreateTrainingRecordInput = z.infer<typeof CreateTrainingRecordSchema>;
export type UpdateTrainingRecordInput = z.infer<typeof UpdateTrainingRecordSchema>;
