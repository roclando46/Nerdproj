import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';
import { aiRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// Grant opportunities
router.get('/', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.post('/', (_req, res) => {
  res.status(201).json({ message: 'Grant created — implementation pending' });
});

router.get('/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

router.patch('/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.delete('/:id', (req, res) => {
  res.json({ id: req.params['id'], deleted: true });
});

// Grant applications
router.get('/applications', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.post('/applications', (_req, res) => {
  res.status(201).json({ message: 'Application created — implementation pending' });
});

router.get('/applications/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

router.patch('/applications/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.delete('/applications/:id', (req, res) => {
  res.json({ id: req.params['id'], deleted: true });
});

// Proposals
router.get('/applications/:id/proposals', (req, res) => {
  res.json({ applicationId: req.params['id'], data: [] });
});

router.post('/applications/:id/proposals', (req, res) => {
  res.status(201).json({ applicationId: req.params['id'], message: 'Proposal section created' });
});

router.get('/applications/:id/proposals/:proposalId', (req, res) => {
  res.json({ id: req.params['proposalId'], applicationId: req.params['id'] });
});

router.patch('/applications/:id/proposals/:proposalId', (req, res) => {
  res.json({ id: req.params['proposalId'], updated: true });
});

// AI generation — rate-limited
router.post('/applications/:id/proposals/:proposalId/generate', aiRateLimiter, (req, res) => {
  res
    .status(200)
    .json({
      message: 'AI generation — Anthropic SDK integration pending',
      proposalId: req.params['proposalId'],
    });
});

router.post('/applications/:id/proposals/:proposalId/regenerate', aiRateLimiter, (req, res) => {
  res.json({ message: 'AI regeneration — pending', proposalId: req.params['proposalId'] });
});

export { router as grantsRouter };
