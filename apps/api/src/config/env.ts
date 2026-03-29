import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1024).max(65535).default(3001),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().min(1),

  // Auth0 — optional in development (auth middleware won't work without these)
  AUTH0_DOMAIN: z.string().min(1).optional(),
  AUTH0_AUDIENCE: z.string().optional(),

  // Anthropic — optional until AI Grant Writer is implemented
  ANTHROPIC_API_KEY: z.string().startsWith('sk-ant-').optional(),

  // Stripe — optional until billing is implemented
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // SendGrid — optional until email is implemented
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).default('Digital Club Secretary'),

  // S3 / MinIO
  S3_ENDPOINT: z.string().url().default('http://localhost:9000'),
  S3_ACCESS_KEY: z.string().min(1).default('minio_admin'),
  S3_SECRET_KEY: z.string().min(1).default('minio_pass_local_dev'),
  S3_BUCKET: z.string().min(1).default('dcs-documents'),
  S3_REGION: z.string().min(1).default('eu-west-2'),

  // Security — generate a random 64-char hex key for local dev
  FIELD_ENCRYPTION_KEY: z
    .string()
    .length(64)
    .default('0000000000000000000000000000000000000000000000000000000000000000'),
});

// Parse and validate — throws at startup if any required var is missing or invalid
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
