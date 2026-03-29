#!/usr/bin/env bash
# =============================================================================
# Digital Club Secretary — One-shot developer setup script
# Run this once after cloning the repo.
# Requires: Node.js 22+, npm 10+, Docker Desktop
# =============================================================================
set -euo pipefail

echo "==> Checking prerequisites..."
node --version
npm --version
docker --version

echo ""
echo "==> Installing dependencies..."
npm install

echo ""
echo "==> Setting up Husky git hooks..."
npm run prepare

echo ""
echo "==> Starting Docker services (PostgreSQL, Redis, MinIO)..."
docker compose up -d

echo ""
echo "==> Waiting for PostgreSQL to be ready..."
until docker compose exec -T postgres pg_isready -U dcs_user > /dev/null 2>&1; do
  sleep 2
done
echo "   PostgreSQL is ready."

echo ""
echo "==> Generating Prisma client..."
npm run db:generate

echo ""
echo "==> Running database migrations..."
npm run db:migrate

echo ""
echo "==> Seeding demo data..."
npm run db:seed

echo ""
echo "============================================================"
echo "  Setup complete!"
echo ""
echo "  Next steps:"
echo "  1. Fill in your real credentials in .env"
echo "     (Auth0, Anthropic, Stripe, SendGrid keys)"
echo "  2. Set up Auth0 (see plan Phase 10)"
echo "  3. Run: npm run dev"
echo "     - API: http://localhost:3001"
echo "     - Web: http://localhost:5173"
echo "     - MinIO console: http://localhost:9001"
echo "     - Prisma Studio: npm run db:studio"
echo "============================================================"
