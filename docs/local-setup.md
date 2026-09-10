# Local Setup And Runbook

This runbook covers bootstrap setup through BOOT-008.

## 1) Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop

## 2) Install dependencies

Run from repository root:

pnpm install

## 3) Configure environment

- Copy .env.example to .env
- Confirm DATABASE_URL and PostgreSQL variables

## 4) Start database

pnpm db:up

## 5) Prisma setup

pnpm --filter @commerceops/api db:generate
pnpm --filter @commerceops/api db:migrate

## 6) Start applications

pnpm dev

Expected local ports:

- web: 3000
- api: 3001

## 7) Authentication and users

Web routes:

- /login
- /register

Self-registration always creates a `customer`. Staff roles must be assigned through
an approved administrative process.

API calls authenticate with:

- `Authorization: Bearer <jwt>`

Set `AUTH_JWT_SECRET` (32+ characters) to the same value in `apps/api/.env` and
`apps/web/.env.local` so the web app can verify tokens the API issues.

## 8) Quality commands

pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e

## 9) Stop database

pnpm db:down
