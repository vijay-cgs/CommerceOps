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

## Authentication baseline

- Web signs in at /login and stores the session token in an httpOnly cookie.
- Users self-register at /register and always receive the `customer` role.
- API resolves request auth context from a bearer JWT issued by /api/v1/auth/login.
- Staff roles (admin, inventory_manager, read_only) are assigned through an approved
  administrative process; the application does not provision test staff automatically.

## Database baseline

- Local PostgreSQL via docker compose
- Prisma schema and initial migration scaffold under apps/api/prisma
- No test-data seed script is included.
