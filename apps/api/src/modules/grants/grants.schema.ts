import { z } from 'zod';

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'IDENTIFIED',
      'RESEARCHING',
      'IN_PROGRESS',
      'SUBMITTED',
      'AWARDED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .optional(),
  search: z.string().optional(),
});

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const ProposalParamSchema = z.object({
  id: z.string().min(1),
  proposalId: z.string().min(1),
});

// ─── Grant Schemas ────────────────────────────────────────────────────────────

export const CreateGrantSchema = z.object({
  name: z.string().min(1).max(300),
  funderName: z.string().min(1).max(300),
  funderUrl: z.string().url().optional(),
  description: z.string().optional(),
  maxAmount: z.number().positive().optional(),
  minAmount: z.number().positive().optional(),
  openDate: z.string().datetime().optional(),
  closeDate: z.string().datetime().optional(),
  eligibilityCriteria: z.string().optional(),
  sportFocus: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum([
      'IDENTIFIED',
      'RESEARCHING',
      'IN_PROGRESS',
      'SUBMITTED',
      'AWARDED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .default('IDENTIFIED'),
  isRecurring: z.boolean().default(false),
});

export const UpdateGrantSchema = CreateGrantSchema.partial();

// ─── Application Schemas ──────────────────────────────────────────────────────

export const CreateApplicationSchema = z.object({
  grantId: z.string().min(1),
  amountRequested: z.number().positive().optional(),
  internalNotes: z.string().optional(),
});

export const UpdateApplicationSchema = z.object({
  status: z
    .enum([
      'IDENTIFIED',
      'RESEARCHING',
      'IN_PROGRESS',
      'SUBMITTED',
      'AWARDED',
      'REJECTED',
      'WITHDRAWN',
    ])
    .optional(),
  amountRequested: z.number().positive().optional(),
  amountAwarded: z.number().positive().optional(),
  submittedAt: z.string().datetime().optional(),
  decisionAt: z.string().datetime().optional(),
  decisionNotes: z.string().optional(),
  internalNotes: z.string().optional(),
});

// ─── Proposal Schemas ─────────────────────────────────────────────────────────

export const CreateProposalSchema = z.object({
  sectionTitle: z.string().min(1).max(200),
});

export const UpdateProposalSchema = z.object({
  sectionTitle: z.string().min(1).max(200).optional(),
  finalContent: z.string().optional(),
  isApproved: z.boolean().optional(),
});

export const GenerateProposalSchema = z.object({
  context: z.string().max(1000).optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListQuery = z.infer<typeof ListQuerySchema>;
export type CreateGrantInput = z.infer<typeof CreateGrantSchema>;
export type UpdateGrantInput = z.infer<typeof UpdateGrantSchema>;
export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>;
export type CreateProposalInput = z.infer<typeof CreateProposalSchema>;
export type UpdateProposalInput = z.infer<typeof UpdateProposalSchema>;
export type GenerateProposalInput = z.infer<typeof GenerateProposalSchema>;
