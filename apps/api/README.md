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

- Auth middleware resolves request identity from a `Authorization: Bearer <jwt>` header.
- Requests without a valid token have no auth context and are rejected by protected routes.
- Auth endpoints:
  - POST /api/v1/auth/register (always creates a `customer`)
  - POST /api/v1/auth/login
  - GET /api/v1/auth/me
- Passwords are hashed with bcrypt (cost 12). Tokens are HS256 JWTs signed with `AUTH_JWT_SECRET`.
- Roles: `admin`, `inventory_manager`, `read_only`, `customer`. Only the first three may read inventory; only the first two may adjust it.
- Staff accounts are provisioned by the seed script when `SEED_STAFF_PASSWORD` is set.
