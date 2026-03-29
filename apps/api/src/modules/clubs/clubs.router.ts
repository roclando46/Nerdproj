import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth, extractTenancy);

// Own club
router.get('/me', (req, res) => {
  res.json({ clubId: req.clubId, message: 'Club details — implementation pending' });
});

router.patch('/me', (req, res) => {
  res.json({ clubId: req.clubId, updated: true });
});

// Members
router.get('/me/members', (req, res) => {
  res.json({ clubId: req.clubId, data: [], total: 0, page: 1, limit: 20, totalPages: 0 });
});

router.post('/me/members', (req, res) => {
  res.status(201).json({ clubId: req.clubId, message: 'Member created — implementation pending' });
});

router.get('/me/members/:id', (req, res) => {
  res.json({ id: req.params['id'], clubId: req.clubId });
});

router.patch('/me/members/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.delete('/me/members/:id', (req, res) => {
  res.json({ id: req.params['id'], deleted: true });
});

export { router as clubsRouter };
