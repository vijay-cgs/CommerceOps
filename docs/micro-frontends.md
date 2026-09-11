# CommerceOps Multi-Zone Frontend

CommerceOps now has a staged Multi-Zone foundation with two independently runnable Next.js zones:

- `apps/storefront`: customer shopping experience, local port `3001`
- `apps/admin`: product, SKU, and inventory operations, local port `3003`
- `apps/web`: existing shell/monolith, local port `3000`

The existing `apps/web` routes remain the source of truth during migration. The new zones are intentionally small entry points so domain routes can move incrementally without breaking the current application.

## Run the zones

From the repository root:

```powershell
pnpm install
pnpm dev:mfe
```

Direct zone URLs:

- `http://localhost:3001` storefront zone
- `http://localhost:3003` admin zone

Use `http://localhost:3000` for the authenticated composed experience. The session cookie is
owned by the shell origin, so direct `localhost:3003` browsing is useful for build/runtime checks
but should not be treated as the authenticated admin entry point.

For direct zone development, copy these files before starting the apps:

- `apps/storefront/.env.local.example` -> `apps/storefront/.env.local`
- `apps/admin/.env.local.example` -> `apps/admin/.env.local`
- `apps/web/.env.local.example` -> `apps/web/.env.local`

The zone apps proxy their `/api/*` requests to the shell at port `3000`, where the
existing authenticated BFF routes remain available during migration. The shell then
proxies application routes to the zones.

## Shell composition

Copy `apps/web/.env.local.example` to `apps/web/.env.local` and start the zones. The shell exposes optional development proxies:

- `/storefront-zone/*` -> `STOREFRONT_ZONE_URL`
- `/admin-zone/*` -> `ADMIN_ZONE_URL`

When those variables are absent, `apps/web` continues to run as the current monolith. This fallback makes the migration reversible.

With the example variables enabled, the shell routes these live paths:

- `/`, `/products`, `/product/*`, `/cart`, `/checkout`, `/orders/*` -> storefront
- `/admin/*`, `/inventory` -> admin

## Ownership boundaries

Storefront owns catalog browsing, product details, cart, checkout, and customer orders.

Admin owns product management, product variants/SKUs, and inventory operations.

`packages/mfe-contracts` contains only small, dependency-light contracts shared by the shell and zones. Domain API clients and providers should move into each zone as routes are migrated.

## Migration order

1. Move storefront layout, auth handoff, and catalog routes into `apps/storefront`.
2. Move admin layout, role guard, product, SKU, and inventory routes into `apps/admin`.
3. Move domain API clients and query keys into zone-owned packages.
4. Keep authentication and navigation contracts at the shell boundary.
5. Remove duplicated routes from `apps/web` after production traffic is fully routed to the zones.
