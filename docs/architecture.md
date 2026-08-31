# CommerceOps Architecture Baseline

This document captures the bootstrap architecture approved for the first execution slice.

## Monorepo

- apps/web: Next.js App Router frontend
- apps/api: NestJS REST API
- packages/ui: shared UI primitives placeholder
- packages/types: shared type contracts
- packages/config-eslint: shared lint baseline
- packages/config-typescript: shared tsconfig baseline

## State ownership baseline

- Inventory server state: TanStack Query (to be wired in Inventory feature work)
- Redux: must not cache Inventory/Product/Order/Customer API entities
- URL/query params: operational filter state
- Local React state: ephemeral UI state only

## API baseline

- Base path: /api/v1
- Health endpoint: GET /api/v1/health
- Correlation ID middleware: x-correlation-id
- Envelope model: success + error envelope primitives
- OpenAPI route: /api/docs

## Authentication baseline (development)

- Web uses dev sign-in route and cookie session for seeded users.
- API resolves request auth context from x-dev-user-id for development requests.
- BOOT-005 is intentionally non-production auth.

## Database baseline

- Local PostgreSQL via docker compose
- Prisma schema and initial migration scaffold under apps/api/prisma
- Seed script scaffold available for incremental data seeding
