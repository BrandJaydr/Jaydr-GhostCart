# Forge Journal - Jaydr GhostCart

This journal tracks structural patterns, architecture conventions, and reusable scaffold discoveries by Forge 🏗️.

---

## 📜 Journal Entries

### [2026-08-06] Stage 1 — Initial Application Scaffold

- **Stage:** AOP-CORE Stage 3 (Planning) + Stage 5 (Execution)
- **Handoff received from:** Scribe 📚 (`README.md` → `@agent:forge`)
- **Files created:** 35 scaffold files

#### Structural Patterns Established

**1. Next.js App Router Route Group Convention**
- Route groups `(auth)` and `(dashboard)` separate unauthenticated and authenticated layout trees.
- Pattern: `src/app/(auth)/[screen]/page.tsx` for public screens, `src/app/(dashboard)/[screen]/page.tsx` for authenticated screens.
- Benefit: Single layout file per group manages auth guard and app shell without prop-drilling.

**2. Adapter Layer Isolation**
- All supplier/marketplace adapters live under `src/lib/adapters/`.
- Pattern: Interface file (`*.interface.ts`) + concrete implementations (`*.adapter.ts`).
- Rule: Mock logic stays in `mock.adapter.ts` — NEVER in components or API routes (Blueprint §Stage 1).

**3. BullMQ Queue Naming Convention**
- Queue names follow `[entity].[action]` pattern: `product.import`, `listing.submit`.
- Job processor files mirror queue names for discoverability.

**4. API Route Stub Pattern**
- Unimplemented routes return `501 Not Implemented` with a descriptive `@agent:atlas` handoff comment.
- Never return `200 OK` from an unimplemented route — prevents silent no-ops in tests.

**5. SQL Migration Naming**
- Format: `NNNN_description.sql` (zero-padded 4-digit sequence number).
- First migration: `0001_init.sql` — all 10 core tables as stubs.
- All tenant-scoped tables include `tenant_id UUID NOT NULL` as required by Blueprint §6.1.

#### Handoffs Placed
- `@agent:atlas` — Implement `/api/products`, `/api/listings` routes and domain logic
- `@agent:archivist` — Finalize migrations, RLS policies, encryption, indexes
- `@agent:forge` — Stage 2: Add auth (next-auth session), navigation shell, design tokens
- `@agent:scout` — Stage 4: Add queue monitoring and observability

---

### [2026-08-08] Stage 2 — Product Corrections & Idempotency Scaffolding

- **Stage:** AOP-CORE Stage 5 (Execution)
- **Handoff received from:** User (Stage 2 planning)
- **Files created:** 6 scaffold files (migration, helper, 2 components, 2 tests)

#### Structural Patterns Established

**6. Hybrid Idempotency Pattern**
- API layer check for fast UX feedback (409 Conflict) + DB constraint as safety net.
- Helper functions in `src/lib/api/idempotency.ts` for duplicate detection and key generation.
- Pattern: `checkDuplicateSourceUrl(tenantId, sourceUrl)` → boolean, `generateIdempotencyKey(operation, params)` → string.
- Benefit: Fast user feedback without sacrificing data integrity.

**7. User Corrections JSONB Pattern**
- Corrections stored as JSONB column preserving both original and corrected values.
- Structure: `{ fieldName: { original: string, corrected: string, correctedAt: string, correctedBy: string } }`.
- Pattern: Separate component for form (`ProductCorrectionForm`) and individual fields (`CorrectionField`).
- Benefit: Full audit trail for compliance while allowing merchant flexibility.

**8. Component Test Naming Convention**
- Component tests use `.tsx` extension when testing React components.
- Pattern: `src/__tests__/components/[ComponentName].test.tsx`.
- Benefit: Clear distinction between API tests (`.ts`) and component tests (`.tsx`).

**9. Migration Increment Pattern**
- Each migration adds one logical schema change or feature set.
- Pattern: `0004_user_corrections.sql` adds corrections column + idempotency constraint + indexes in one file.
- Benefit: Atomic schema changes with clear rollback boundaries.

#### Handoffs Placed
- `@agent:atlas` — Implement actual duplicate detection logic in API routes
- `@agent:atlas` — Implement correction persistence logic in worker
- `@agent:forge` — Stage 2+: Add design tokens and styling to correction UI
- `@agent:archivist` — Review migration for RLS policy alignment
