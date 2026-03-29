import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/audit.js';
import { validate, IdParamSchema } from '../../middleware/validate.js';
import {
  ListQuerySchema,
  CreateDBSRecordSchema,
  UpdateDBSRecordSchema,
  CreateTrainingRecordSchema,
  UpdateTrainingRecordSchema,
} from './compliance.schema.js';
import * as controller from './compliance.controller.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// Dashboard, members dropdown, alerts, export
router.get('/dashboard', controller.getDashboard);
router.get('/members', controller.listMembers);
router.get('/alerts', controller.getAlerts);
router.get(
  '/export',
  auditLog({
    action: 'EXPORT',
    entityType: 'ComplianceRecord',
    getEntityId: (req) => req.clubId,
  }),
  controller.exportCompliance,
);

// ─── DBS Records ──────────────────────────────────────────────────────────────

router.get('/dbs', validate({ query: ListQuerySchema }), controller.listDBSRecords);

router.post(
  '/dbs',
  validate({ body: CreateDBSRecordSchema }),
  auditLog({
    action: 'CREATE',
    entityType: 'DBSRecord',
    getEntityId: (req) => (req.body as { memberId?: string })?.memberId,
  }),
  controller.createDBSRecord,
);

router.get('/dbs/:id', validate({ params: IdParamSchema }), controller.getDBSRecord);

router.patch(
  '/dbs/:id',
  validate({ params: IdParamSchema, body: UpdateDBSRecordSchema }),
  auditLog({
    action: 'UPDATE',
    entityType: 'DBSRecord',
    getEntityId: (req) => req.params['id'] as string,
  }),
  controller.updateDBSRecord,
);

// ─── Training Records ─────────────────────────────────────────────────────────

router.get('/training', validate({ query: ListQuerySchema }), controller.listTrainingRecords);

router.post(
  '/training',
  validate({ body: CreateTrainingRecordSchema }),
  controller.createTrainingRecord,
);

router.get('/training/:id', validate({ params: IdParamSchema }), controller.getTrainingRecord);

router.patch(
  '/training/:id',
  validate({ params: IdParamSchema, body: UpdateTrainingRecordSchema }),
  controller.updateTrainingRecord,
);

router.delete(
  '/training/:id',
  validate({ params: IdParamSchema }),
  controller.deleteTrainingRecord,
);

// ECB Safe Hands stub
router.post('/ecb-sync', controller.ecbSync);

export { router as complianceRouter };
