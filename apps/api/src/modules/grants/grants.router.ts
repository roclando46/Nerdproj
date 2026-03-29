import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';
import { auditLog } from '../../middleware/audit.js';
import { validate, IdParamSchema } from '../../middleware/validate.js';
import {
  ListQuerySchema,
  CreateGrantSchema,
  UpdateGrantSchema,
  CreateApplicationSchema,
  UpdateApplicationSchema,
  CreateProposalSchema,
  UpdateProposalSchema,
  GenerateProposalSchema,
  ProposalParamSchema,
} from './grants.schema.js';
import * as controller from './grants.controller.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// ─── Applications — MUST come before /:id ────────────────────────────────────

router.get('/applications', validate({ query: ListQuerySchema }), controller.listApplications);

router.post(
  '/applications',
  validate({ body: CreateApplicationSchema }),
  auditLog({
    action: 'CREATE',
    entityType: 'GrantApplication',
    getEntityId: (req) => (req.body as { grantId?: string })?.grantId,
  }),
  controller.createApplication,
);

router.get('/applications/:id', validate({ params: IdParamSchema }), controller.getApplication);

router.patch(
  '/applications/:id',
  validate({ params: IdParamSchema, body: UpdateApplicationSchema }),
  auditLog({
    action: 'UPDATE',
    entityType: 'GrantApplication',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.updateApplication,
);

router.get(
  '/applications/:id/proposals',
  validate({ params: IdParamSchema }),
  controller.listProposals,
);

router.post(
  '/applications/:id/proposals',
  validate({ params: IdParamSchema, body: CreateProposalSchema }),
  controller.createProposal,
);

router.patch(
  '/applications/:id/proposals/:proposalId',
  validate({ params: ProposalParamSchema, body: UpdateProposalSchema }),
  controller.updateProposal,
);

router.post(
  '/applications/:id/proposals/:proposalId/generate',
  aiRateLimiter,
  validate({ params: ProposalParamSchema, body: GenerateProposalSchema }),
  controller.generateDraft,
);

router.post(
  '/applications/:id/proposals/:proposalId/regenerate',
  aiRateLimiter,
  validate({ params: ProposalParamSchema, body: GenerateProposalSchema }),
  controller.generateDraft,
);

// ─── Grants (after /applications) ────────────────────────────────────────────

router.get('/', validate({ query: ListQuerySchema }), controller.listGrants);

router.post(
  '/',
  validate({ body: CreateGrantSchema }),
  auditLog({
    action: 'CREATE',
    entityType: 'Grant',
    getEntityId: (req) => req.body?.name as string,
  }),
  controller.createGrant,
);

router.get('/:id', validate({ params: IdParamSchema }), controller.getGrant);

router.patch(
  '/:id',
  validate({ params: IdParamSchema, body: UpdateGrantSchema }),
  auditLog({
    action: 'UPDATE',
    entityType: 'Grant',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.updateGrant,
);

router.delete(
  '/:id',
  validate({ params: IdParamSchema }),
  auditLog({
    action: 'DELETE',
    entityType: 'Grant',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.deleteGrant,
);

export { router as grantsRouter };
