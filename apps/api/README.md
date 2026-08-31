BOOT-003 baseline is in place for the NestJS API workspace.

Current baseline includes:
- Global API prefix: /api/v1
- Health endpoint controller: GET /api/v1/health
- Correlation ID middleware and response header propagation
- Standard success and error envelope primitives
- Global validation pipe and global exception filter
- OpenAPI document setup at /api/docs

BOOT-004 and BOOT-005 will add database and authenticated identity integration.

BOOT-004 status:
- Prisma schema and initial migration scaffold exist under prisma/.
- Seed script placeholder exists at prisma/seed.js.
- DATABASE_URL example exists in .env.example.

BOOT-005 status:
- Dev auth middleware resolves request identity from x-dev-user-id header.
- Default identity falls back to read-only seed user when header is absent.
- Dev auth endpoints:
	- GET /api/v1/dev-auth/users
	- GET /api/v1/dev-auth/me
