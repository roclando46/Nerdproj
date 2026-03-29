import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { globalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { v1Router } from './routes/v1.js';
import { env } from './config/env.js';

export function createApp(): express.Application {
  const app = express();

  // ─── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: env.NODE_ENV === 'production',
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type'],
    }),
  );

  // ─── Body parsing ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // ─── Rate limiting ─────────────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── Trust proxy (for accurate IP behind load balancer) ───────────────────
  if (env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // ─── Routes ────────────────────────────────────────────────────────────────
  app.use('/api/v1', v1Router);

  // ─── 404 handler ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global error handler (must be last) ──────────────────────────────────
  app.use(errorHandler);

  return app;
}
