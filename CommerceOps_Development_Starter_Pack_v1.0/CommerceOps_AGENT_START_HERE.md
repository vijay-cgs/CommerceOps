# CommerceOps — Coding Agent Start Here

## Read in this order

1. `CommerceOps_Master_Specification_v1.0.docx`
2. `CommerceOps_EPIC-03_Inventory_Development_Spec_v1.0.docx`
3. Current repository `README`, ADRs and package-level instructions
4. Existing tests and code before proposing changes

## First delivery goal

Implement the approved **Phase 0 engineering bootstrap** only where it is still missing, then deliver **INV-F03 — Controlled Stock Adjustment** incrementally using `INV-US001` through `INV-US009`.

Do **not** build later CommerceOps Epics or unrelated platform infrastructure.

## Mandatory invariants

- TanStack Query owns Inventory server state.
- Redux must not hold Inventory/Product/Order/Customer API entity caches.
- Do not introduce RTK Query.
- API authorization is mandatory for `inventory.adjust`; UI permission checks are UX only.
- Inventory adjustments are delta-based, append-only and auditable.
- Available inventory cannot become negative.
- `expectedVersion` optimistic concurrency protection is mandatory.
- `Idempotency-Key` duplicate protection is mandatory.
- Inventory update + InventoryAdjustment + audit persistence must be transactional.
- Actor identity comes from authenticated server context, not the client request body.
- Do not hard-code brands, SKUs, user IDs, location IDs or seed IDs into feature logic.
- Do not silently alter architecture, approved dependencies, data model, public API contracts, security model, scope or acceptance criteria.

## Working pattern for each batch

1. Inspect the current repository before editing.
2. State the Story IDs being implemented.
3. Surface open questions/assumptions that materially affect correctness.
4. Propose a concise implementation plan with expected files and tests.
5. For RBAC, insufficient-stock, idempotency and version-conflict behavior, establish human-owned or human-reviewed acceptance tests before trusting the implementation.
6. Implement a small reviewable batch.
7. Run applicable typecheck, lint, tests and builds.
8. Report:
   - Story IDs completed
   - Files changed
   - Tests added/updated and results
   - Architecture/spec deviations (normally none)
   - Remaining risks/open questions
   - Confidence: **High confidence / Needs focused review / Uncertain**

## First execution sequence

- `BOOT-001..008` — minimum runnable platform
- `INV-US001` — Inventory adjustment context
- `INV-US002 + INV-US003` — accessible adjustment UI + validation
- `INV-US004` — authorized transactional mutation + audit
- `INV-US007 + INV-US008` — idempotency + stale-version protection
- `INV-US005 + INV-US006` — cache refresh + failure UX
- `INV-US009` — minimal adjustment history
- Complete INV-F03 Definition of Done
- Then begin `INV-F04`

If code and specification disagree, stop and resolve the discrepancy through the spec/ADR process rather than allowing implementation to silently redefine the architecture.
