import { z } from 'zod';

export const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'POSTPONED', 'COMPLETED']).optional(),
  upcoming: z.coerce.boolean().optional(),
});

export const IdParamSchema = z.object({ id: z.string().min(1) });

export const AssignmentParamSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
});

// ─── Fixture Schemas ──────────────────────────────────────────────────────────

export const CreateFixtureSchema = z.object({
  sport: z.enum(['CRICKET', 'RUGBY', 'BOTH']),
  fixtureDate: z.string().datetime(),
  kickoffTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format')
    .optional(),
  homeTeamName: z.string().min(1).max(200),
  awayTeamName: z.string().min(1).max(200),
  isHomeFixture: z.boolean().default(true),
  venue: z.string().max(300).optional(),
  venuePostcode: z.string().max(10).optional(),
  ageGroup: z.string().max(50).optional(),
  competition: z.string().max(200).optional(),
  oppositionContact: z.string().max(300).optional(),
});

export const UpdateFixtureSchema = CreateFixtureSchema.partial().extend({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'POSTPONED', 'COMPLETED']).optional(),
  resultsNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

// ─── Assignment Schemas ───────────────────────────────────────────────────────

export const CreateAssignmentSchema = z
  .object({
    volunteerId: z.string().min(1),
    role: z.enum([
      'SCORER',
      'UMPIRE',
      'FIRST_AIDER',
      'TRANSPORT',
      'TEA_DUTY',
      'GROUNDSPERSON',
      'SAFEGUARDING_OFFICER',
      'CUSTOM',
    ]),
    customRoleName: z.string().max(100).optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'CUSTOM' && !data.customRoleName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customRoleName'],
        message: 'Custom role name is required when role is CUSTOM',
      });
    }
  });

export const UpdateAssignmentSchema = z.object({
  confirmedAt: z.string().datetime().optional(),
  declinedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// ─── Volunteer Profile Schema ─────────────────────────────────────────────────

export const UpsertVolunteerProfileSchema = z.object({
  memberId: z.string().min(1),
  availableRoles: z
    .array(
      z.enum([
        'SCORER',
        'UMPIRE',
        'FIRST_AIDER',
        'TRANSPORT',
        'TEA_DUTY',
        'GROUNDSPERSON',
        'SAFEGUARDING_OFFICER',
        'CUSTOM',
      ]),
    )
    .optional(),
  isAvailableGeneral: z.boolean().optional(),
  notes: z.string().optional(),
});

// ─── Auto-suggest Schema ──────────────────────────────────────────────────────

export const AutoSuggestSchema = z.object({
  role: z.enum([
    'SCORER',
    'UMPIRE',
    'FIRST_AIDER',
    'TRANSPORT',
    'TEA_DUTY',
    'GROUNDSPERSON',
    'SAFEGUARDING_OFFICER',
    'CUSTOM',
  ]),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type ListQuery = z.infer<typeof ListQuerySchema>;
export type CreateFixtureInput = z.infer<typeof CreateFixtureSchema>;
export type UpdateFixtureInput = z.infer<typeof UpdateFixtureSchema>;
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
export type UpsertVolunteerProfileInput = z.infer<typeof UpsertVolunteerProfileSchema>;
export type AutoSuggestInput = z.infer<typeof AutoSuggestSchema>;
