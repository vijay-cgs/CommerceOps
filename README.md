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
4. Run migrations:
   - pnpm --filter @commerceops/api db:generate
   - pnpm --filter @commerceops/api db:migrate
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

Staff accounts are not provisioned automatically. Self-registration creates customer
accounts; staff roles must be assigned through an approved administrative process.

Web sign-in route:

- /login

API authentication:

- `Authorization: Bearer <jwt>`

`AUTH_JWT_SECRET` must be set to the same value in `apps/api/.env` and
`apps/web/.env.local`, and must be at least 32 characters.

## BOOT-004 Database Baseline

- Local PostgreSQL service definition is available in docker-compose.yml.
- Prisma schema and migrations are in apps/api/prisma.

Typical sequence once dependencies are installed:

1. Copy .env.example to .env.
2. Run docker compose up -d postgres.
3. Run pnpm --filter @commerceops/api db:generate.
4. Run pnpm --filter @commerceops/api db:migrate.
