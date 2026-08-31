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
pnpm --filter @commerceops/api db:seed

## 6) Start applications

pnpm dev

Expected local ports:
- web: 3000
- api: 3001

## 7) Development auth and seeded users

Web sign-in page:
- /auth/dev-sign-in

Seeded users (no passwords required in this bootstrap flow):
- Store Admin: admin@commerceops.local
- Inventory Manager: inventory@commerceops.local
- Read-only Ops: readonly@commerceops.local

API identity header for development calls:
- x-dev-user-id: seed-admin-001 | seed-inventory-001 | seed-readonly-001

## 8) Quality commands

pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e

## 9) Stop database

pnpm db:down
