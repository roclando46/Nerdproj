import { Router } from 'express';
import { clubsRouter } from '../modules/clubs/clubs.router.js';
import { complianceRouter } from '../modules/compliance/compliance.router.js';
import { fixturesRouter } from '../modules/fixtures/fixtures.router.js';
import { grantsRouter } from '../modules/grants/grants.router.js';
import { usersRouter } from '../modules/users/users.router.js';

const v1Router = Router();

// Health check (public — no auth)
v1Router.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1', timestamp: new Date().toISOString() });
});

// Authenticated routes
v1Router.use('/clubs', clubsRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/compliance', complianceRouter);
v1Router.use('/grants', grantsRouter);
v1Router.use('/fixtures', fixturesRouter);

export { v1Router };
