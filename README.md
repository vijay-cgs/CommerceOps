# CommerceOps Monorepo

This repository contains the CommerceOps bootstrap implementation through BOOT-008 scaffolding for EPIC-03 inventory delivery.

## Monorepo layout

- apps/web
- apps/api
- packages/ui
- packages/types
- packages/config-eslint
- packages/config-typescript

## Bootstrap status

- BOOT-001: repository scaffold completed
- BOOT-002: web baseline completed
- BOOT-003: API baseline completed
- BOOT-004: database baseline scaffold completed
- BOOT-005: development auth baseline completed
- BOOT-006: quality baseline scaffolding completed
- BOOT-007: CI workflow scaffold completed
- BOOT-008: documentation baseline completed

## Architecture links

- docs/architecture.md
- docs/local-setup.md

## Quick start

1. Install dependencies:
   - pnpm install
2. Configure environment:
   - copy .env.example .env
3. Start database:
   - pnpm db:up
4. Run migrations and seed:
   - pnpm --filter @commerceops/api db:generate
   - pnpm --filter @commerceops/api db:migrate
   - pnpm --filter @commerceops/api db:seed
5. Start apps:
   - pnpm dev

## Quality baseline commands

- pnpm typecheck
- pnpm lint
- pnpm test:unit
- pnpm build
- pnpm test:e2e

## Authentication

Shoppers register themselves at `/register` and always receive the `customer` role.

Staff accounts are provisioned by the seed script. Set `SEED_STAFF_PASSWORD` in
`apps/api/.env` and run `pnpm --filter @commerceops/api db:seed` to create:

- admin@commerceops.local (`admin`)
- inventory@commerceops.local (`inventory_manager`)
- readonly@commerceops.local (`read_only`)

Web sign-in route:

- /login

API authentication:

- `Authorization: Bearer <jwt>`

`AUTH_JWT_SECRET` must be set to the same value in `apps/api/.env` and
`apps/web/.env.local`, and must be at least 32 characters.

## BOOT-004 Database Baseline

- Local PostgreSQL service definition is available in docker-compose.yml.
- Prisma schema, migration scaffold, and seed placeholder are in apps/api/prisma.

Typical sequence once dependencies are installed:

1. Copy .env.example to .env.
2. Run docker compose up -d postgres.
3. Run pnpm --filter @commerceops/api db:generate.
4. Run pnpm --filter @commerceops/api db:migrate.
5. Run pnpm --filter @commerceops/api db:seed.
