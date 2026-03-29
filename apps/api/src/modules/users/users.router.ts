import { Router } from 'express';
import { requireAuth, extractTenancy } from '../../middleware/auth.js';

const router = Router();

router.use(requireAuth, extractTenancy);

router.get('/me', (req, res) => {
  res.json({
    sub: req.auth?.payload?.sub,
    clubId: req.clubId,
    role: req.userRole,
    message: 'User profile — implementation pending',
  });
});

router.patch('/me', (req, res) => {
  res.json({ updated: true });
});

// Volunteer profiles
router.get('/volunteers', (req, res) => {
  res.json({ clubId: req.clubId, data: [], total: 0 });
});

router.post('/volunteers', (req, res) => {
  res.status(201).json({ message: 'Volunteer profile created — implementation pending' });
});

router.get('/volunteers/:id', (req, res) => {
  res.json({ id: req.params['id'] });
});

router.patch('/volunteers/:id', (req, res) => {
  res.json({ id: req.params['id'], updated: true });
});

router.delete('/volunteers/:id', (req, res) => {
  res.json({ id: req.params['id'], deleted: true });
});

export { router as usersRouter };
