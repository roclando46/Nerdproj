import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/audit.js';
import { validate, IdParamSchema } from '../../middleware/validate.js';
import {
  ListQuerySchema,
  CreateFixtureSchema,
  UpdateFixtureSchema,
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  UpsertVolunteerProfileSchema,
  AutoSuggestSchema,
  AssignmentParamSchema,
} from './fixtures.schema.js';
import * as controller from './fixtures.controller.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// ─── Static routes — MUST come before /:id ───────────────────────────────────

router.get('/upcoming', controller.getUpcoming);

router.get('/calendar', controller.generateIcal);

router.get('/volunteers', controller.listVolunteerProfiles);

router.post(
  '/volunteers',
  validate({ body: UpsertVolunteerProfileSchema }),
  controller.upsertVolunteerProfile,
);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

router.get('/', validate({ query: ListQuerySchema }), controller.listFixtures);

router.post(
  '/',
  validate({ body: CreateFixtureSchema }),
  auditLog({
    action: 'CREATE',
    entityType: 'Fixture',
    getEntityId: (req) => (req.body as { homeTeamName?: string })?.homeTeamName ?? 'unknown',
  }),
  controller.createFixture,
);

router.get('/:id', validate({ params: IdParamSchema }), controller.getFixture);

router.patch(
  '/:id',
  validate({ params: IdParamSchema, body: UpdateFixtureSchema }),
  auditLog({
    action: 'UPDATE',
    entityType: 'Fixture',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.updateFixture,
);

router.delete(
  '/:id',
  validate({ params: IdParamSchema }),
  auditLog({
    action: 'DELETE',
    entityType: 'Fixture',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.deleteFixture,
);

// ─── Assignments — auto-suggest MUST come before /:assignmentId ──────────────

router.post(
  '/:id/assignments/auto-suggest',
  validate({ params: IdParamSchema, body: AutoSuggestSchema }),
  controller.autoSuggestVolunteers,
);

router.get('/:id/assignments', validate({ params: IdParamSchema }), controller.listAssignments);

router.post(
  '/:id/assignments',
  validate({ params: IdParamSchema, body: CreateAssignmentSchema }),
  auditLog({
    action: 'CREATE',
    entityType: 'VolunteerAssignment',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.createAssignment,
);

router.patch(
  '/:id/assignments/:assignmentId',
  validate({ params: AssignmentParamSchema, body: UpdateAssignmentSchema }),
  auditLog({
    action: 'UPDATE',
    entityType: 'VolunteerAssignment',
    getEntityId: (req) => req.params['assignmentId'] as string,
  }),
  controller.updateAssignment,
);

router.delete(
  '/:id/assignments/:assignmentId',
  validate({ params: AssignmentParamSchema }),
  auditLog({
    action: 'DELETE',
    entityType: 'VolunteerAssignment',
    getEntityId: (req) => req.params['assignmentId'] as string,
  }),
  controller.deleteAssignment,
);

export { router as fixturesRouter };
