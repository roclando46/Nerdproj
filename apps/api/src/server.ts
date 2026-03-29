// Load .env FIRST — must happen before any env-dependent modules are imported.
// In ESM, static imports are hoisted, so we use dynamic imports for everything
// that reads process.env at module load time.
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

// Dynamic imports so that env validation in config/env.ts runs AFTER dotenv loads
const { createApp } = await import('./app.js');
const { env } = await import('./config/env.js');
const { prisma } = await import('@dcs/database');
const { redis } = await import('./config/redis.js');

async function start(): Promise<void> {
  // Verify database connection
  await prisma.$connect();
  console.warn('Database connected');

  // Connect Redis
  try {
    await redis.connect();
    console.warn('Redis connected');
  } catch (err) {
    console.warn('Redis connection failed — continuing without cache:', err);
  }

  const app = createApp();

  app.listen(env.API_PORT, () => {
    console.warn(`API running on http://localhost:${env.API_PORT}`);
    console.warn(`Environment: ${env.NODE_ENV}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
