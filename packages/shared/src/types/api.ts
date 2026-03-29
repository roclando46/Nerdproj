import { z } from 'zod';

// ─── Generic API response wrappers ────────────────────────────────────────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// ─── Compliance Zod schemas (shared between API validation and form validation) ─

export const CreateDBSRecordSchema = z.object({
  memberId: z.string().min(1),
  checkDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  checkType: z.enum(['BASIC', 'STANDARD', 'ENHANCED']).default('ENHANCED'),
  issuedBy: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateDBSRecord = z.infer<typeof CreateDBSRecordSchema>;

export const CreateTrainingRecordSchema = z.object({
  memberId: z.string().min(1),
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
  completedAt: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  provider: z.string().max(200).optional(),
  certificateRef: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateTrainingRecord = z.infer<typeof CreateTrainingRecordSchema>;

// ─── Grant Zod schemas ─────────────────────────────────────────────────────────

export const CreateGrantApplicationSchema = z.object({
  grantId: z.string().min(1),
  amountRequested: z.number().positive().optional(),
  internalNotes: z.string().max(2000).optional(),
});

export type CreateGrantApplication = z.infer<typeof CreateGrantApplicationSchema>;

export const GenerateProposalSchema = z.object({
  sectionTitle: z.string().min(1).max(200),
  context: z.string().max(4000).optional(), // Club context for the AI
});

export type GenerateProposal = z.infer<typeof GenerateProposalSchema>;

// ─── Fixture Zod schemas ───────────────────────────────────────────────────────

export const CreateFixtureSchema = z.object({
  sport: z.enum(['CRICKET', 'RUGBY', 'BOTH']),
  fixtureDate: z.string().datetime(),
  kickoffTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  homeTeamName: z.string().min(1).max(200),
  awayTeamName: z.string().min(1).max(200),
  isHomeFixture: z.boolean().default(true),
  venue: z.string().max(300).optional(),
  venuePostcode: z.string().max(10).optional(),
  ageGroup: z.string().max(50).optional(),
  competition: z.string().max(200).optional(),
  oppositionContact: z.string().max(200).optional(),
});

export type CreateFixture = z.infer<typeof CreateFixtureSchema>;
