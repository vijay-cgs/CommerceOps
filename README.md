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

## Development seed identities

- admin@commerceops.local (seed-admin-001)
- inventory@commerceops.local (seed-inventory-001)
- readonly@commerceops.local (seed-readonly-001)

Web sign-in route:
- /auth/dev-sign-in

API development identity header:
- x-dev-user-id

## BOOT-004 Database Baseline

- Local PostgreSQL service definition is available in docker-compose.yml.
- Prisma schema, migration scaffold, and seed placeholder are in apps/api/prisma.

Typical sequence once dependencies are installed:

1. Copy .env.example to .env.
2. Run docker compose up -d postgres.
3. Run pnpm --filter @commerceops/api db:generate.
4. Run pnpm --filter @commerceops/api db:migrate.
5. Run pnpm --filter @commerceops/api db:seed.
