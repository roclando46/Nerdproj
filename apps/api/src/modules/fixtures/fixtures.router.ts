import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// Fixtures
router.get('/', (_req, res) => {
  res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.get('/upcoming', (_req, res) => {
  res.json({ data: [] });
});

router.get('/calendar', (_req, res) => {
  // Returns iCal format in production
  res.set('Content-Type', 'text/calendar');
  res.send('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR');
});

router.post('/', (_req, res) => {
  res.status(201).json({ message: 'Fixture created — implementation pending' });
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

// Volunteer assignments for a fixture
router.get('/:id/assignments', (req, res) => {
  res.json({ fixtureId: req.params['id'], data: [] });
});

router.post('/:id/assignments', (req, res) => {
  res.status(201).json({ fixtureId: req.params['id'], message: 'Volunteer assigned' });
});

router.patch('/:id/assignments/:assignmentId', (req, res) => {
  res.json({ id: req.params['assignmentId'], updated: true });
});

router.delete('/:id/assignments/:assignmentId', (req, res) => {
  res.json({ id: req.params['assignmentId'], deleted: true });
});

router.post('/:id/assignments/auto-suggest', (req, res) => {
  res.json({
    fixtureId: req.params['id'],
    suggestions: [],
    message: 'AI volunteer matching — implementation pending',
  });
});

export { router as fixturesRouter };
