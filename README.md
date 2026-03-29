"# Digital Club Secretary

SaaS platform for UK amateur cricket and rugby clubs — compliance, AI-powered grants, and fixture/volunteer coordination.

## Prerequisites

- **Node.js 22+** — install via nvm: `nvm install 22 && nvm use 22`
- **npm 10+** — included with Node.js 22
- **Docker Desktop** — for local PostgreSQL, Redis, MinIO

## Quick Start

```bash
# 1. Install Node.js 22 (first time only)
nvm install 22
nvm use 22

# 2. Copy environment file and fill in your credentials
cp .env.example .env
# Edit .env — at minimum set Auth0 and Anthropic keys

# 3. One-shot setup (install deps, start Docker, migrate DB, seed data)
bash scripts/setup-dev.sh

# 4. Start development servers
npm run dev
```

| Service       | URL                   |
| ------------- | --------------------- |
| Web app       | http://localhost:5173 |
| API           | http://localhost:3001 |
| MinIO console | http://localhost:9001 |
| Prisma Studio | `npm run db:studio`   |

## Project Structure

```
apps/
  api/          Node.js 22 + Express + TypeScript (port 3001)
  web/          React 19 + Vite + Tailwind CSS (port 5173)
packages/
  shared/       Shared TypeScript types, Zod schemas, constants
  database/     Prisma ORM + PostgreSQL schema
  ui/           Shared React component library
```

## Modules

| Module                      | Status                                  |
| --------------------------- | --------------------------------------- |
| Compliance Sentinel         | Stub routers ✓ — implementation pending |
| AI Grant Writer             | Stub routers ✓ — implementation pending |
| Fixture & Volunteer Manager | Stub routers ✓ — implementation pending |

## Common Commands

```bash
npm run dev           # Start all dev servers
npm run build         # Build all packages
npm run lint          # Lint all packages
npm run typecheck     # TypeScript check all packages
npm run test          # Run all unit tests
npm run db:migrate    # Run Prisma migrations
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
docker compose up -d  # Start local services
docker compose down   # Stop local services
```

## Auth0 Setup (required before first login)

1. Create an Auth0 **Single Page Application**
   - Callback URL: `http://localhost:5173/callback`
   - Logout URL: `http://localhost:5173`
   - Web Origin: `http://localhost:5173`
2. Create an Auth0 **API** with audience `https://api.digitalclubsecretary.co.uk`
3. Add an Auth0 **Action** (Login / Post-Login) to inject `clubId` and `role` into the access token
4. Copy values to `.env`

## Commit Convention

Uses [Conventional Commits](https://www.conventionalcommits.org/):

````
feat(compliance): add DBS expiry alert query
fix(api): handle missing clubId in tenancy middleware
chore(deps): update @anthropic-ai/sdk to 0.28.0
```"
````
