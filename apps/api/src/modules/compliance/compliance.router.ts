import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';

const router = Router();

// Apply auth to all compliance routes
router.use(requireAuth, extractTenancy);

// Dashboard / aggregate
router.get('/dashboard', (_req, res) => {
  res.json({ message: 'Compliance dashboard — coming soon', module: 'compliance' });
});

// Compliance records (per member)
router.get('/records', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.get('/records/:memberId', (req, res) => {
  res.json({ memberId: req.params['memberId'], status: 'PENDING' });
});

// DBS records
router.get('/dbs', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.post('/dbs', (_req, res) => {
  res.status(201).json({ message: 'DBS record created — implementation pending' });
});

router.get('/dbs/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

router.patch('/dbs/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.post('/dbs/:id/upload', (req, res) => {
  res.json({ id: req.params['id'], uploadUrl: null, message: 'Upload — implementation pending' });
});

// Training records
router.get('/training', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.post('/training', (_req, res) => {
  res.status(201).json({ message: 'Training record created — implementation pending' });
});

router.get('/training/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

router.patch('/training/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.delete('/training/:id', (req, res) => {
  res.json({ id: req.params['id'], deleted: true });
});

// Alerts and reports
router.get('/alerts', (_req, res) => {
  res.json({ expiringDbs: [], overdueTraining: [] });
});

router.get('/export', (_req, res) => {
  res.json({ message: 'Export — implementation pending' });
});

// ECB Safe Hands stub
router.post('/ecb-sync', (_req, res) => {
  res.json({
    success: true,
    message: 'ECB Safe Hands sync — stub response (real API integration pending)',
    synced: 0,
  });
});

export { router as complianceRouter };
