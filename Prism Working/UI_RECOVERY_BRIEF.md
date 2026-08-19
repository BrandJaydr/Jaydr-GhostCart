# GhostCart UI Recovery Brief

**Status:** Proposed corrective direction — awaiting stakeholder approval  
**Date:** 2026-08-12  
**Scope:** Recover a buildable, accessible operational UI before additional dashboard screens are built.

## Decision to lock

GhostCart is a standalone Next.js operational application. Its UI foundation is:

| Concern | Owner | Rule |
|---|---|---|
| App structure | GhostCart-owned semantic HTML + Tailwind CSS | `header`, `aside`, `main`, CSS Grid/Flex. Do not expect a library layout shell. |
| Interactive primitives | HeroUI v2 | Buttons, inputs, select, dropdown, modal, table, navbar, breadcrumbs, spinner, and supported toast API. Use the API actually exported by the installed version. |
| Product patterns | GhostCart wrapper/domain components | `AppShell`, `Sidebar`, `PageHeader`, `StatusBadge`, `EmptyState`, `ErrorState`, `DataTable`, import/review/listing patterns. |
| Icons | Lucide React | Replace emoji navigation and action icons; supply text labels/tooltips for icon-only controls. |
| Motion | CSS first; existing Framer Motion only when it communicates state | Respect reduced motion. MagicUI/Lightswind are deferred until a named interaction cannot be met by the existing stack. |

This does **not** introduce Ant Design, React Spectrum, React Aria, shadcn/ui, MagicUI, or Lightswind as additional foundations. HeroUI already depends on React Aria behavior where relevant; importing another component foundation now would multiply styling, accessibility, and maintenance rules.

## What is misaligned

1. **No source of truth.** `tasks/todo.md` says component-library selection is open; `PRISM_JOURNAL.md` says HeroUI v2 is selected; `DESIGN_PROPOSAL.md` selects HeroUI but its roadmap and conclusion require shadcn/ui; `Docs/Frontend UI Component Tree.md` describes a WordPress/shadcn future architecture.
2. **Library capability was assumed, not verified.** HeroUI v2 does not export Ant Design's `Layout`, `Layout.Header`, `Layout.Sider`, or `Layout.Content`, nor does it provide a generic `Sidebar` component. HeroUI uses composition; its compound APIs are explicit, separately exported components (for example `CardHeader`/`CardBody`), not arbitrary `Parent.Child` namespaces.
3. **The shell was built ahead of its contracts.** `AppShell` fails to type-check, `ToastProvider` uses a toast component outside its required collection/state contract, and the local `Button`/`Input` wrappers omit ordinary form props their sign-in consumer needs.
4. **The design system is not activated.** No application CSS file is present or imported, despite Tailwind/token documents. There is therefore no verified global token, base-style, or reduced-motion layer.
5. **The current navigation is not production-ready.** It uses emoji as interface icons, does not expose active-route state, duplicates brand/navigation across top bar and sidebar, and has no defined mobile navigation, focus behavior, or session-backed user actions.

## UX direction

Design GhostCart as a calm operations workspace, not a marketing dashboard:

- Persistent desktop sidebar for primary work areas; a dismissible mobile drawer with focus trap and Escape support.
- Compact top bar for contextual search, notifications, and account controls. Avoid duplicate logo/navigation controls.
- The page body starts with task context: title, status/freshness, one primary action, then data. Do not lead with decorative metric-card mosaics.
- Use data tables for products, listings, and jobs on desktop; provide a deliberate compact/mobile representation rather than squeezing columns.
- Surface automation state through clear text + color + icon: paused, queued, needs review, failed, submitted. Destructive actions require confirmation and clear impact copy.
- Keep motion limited to panel/drawer transitions, loading/state change feedback, and deliberate list updates. Every animation needs a reduced-motion equivalent.

## Recovery sequence

1. **Freeze and reconcile documentation.** This brief becomes the implementation authority. Mark the WordPress/shadcn tree historical and remove contradictory shadcn implementation instructions from the active plan.
2. **Make the foundation compile.** Replace the unsupported HeroUI `Layout` with a semantic CSS Grid/Flex shell. Repair or temporarily bypass the incompatible toast wrapper and extend owned Button/Input wrappers with standard form props. Resolve the separate Next.js auth-route export error.
3. **Activate tokens.** Add and import one global CSS entry point with semantic color, spacing, typography, focus-ring, dark-mode, and reduced-motion tokens. Map HeroUI theme values to these tokens; do not scatter raw Tailwind colors in components.
4. **Certify one vertical slice.** Build only sign-in → import → product review → listing draft, with loading, empty, validation, error, and success states. Verify desktop, 768px tablet, and 375px mobile behavior; keyboard-only navigation; and screen-reader labels.
5. **Expand by workflow, not by component inventory.** Build products/listings/jobs after the first slice works against real API states. A component is promoted into the owned layer only after it is used twice or represents a core domain pattern.
6. **Harden UI/UX Interactions and Processing Isolation.** Ensure all navigation elements utilize pure CSS hovers (eliminating state-driven re-renders). Implement click-based panel drawer toggling (preventing hover collapses) and stage-based progress visualization (`SmartLoading` pattern) for long-running imports. Enforce RLS-backed token safety (OAuth Valet Key proxying) and isolate execution to Layer 3 BullMQ background workers.


## Definition of done for the shell

- `tsc --noEmit`, lint, and the relevant UI tests pass.
- No unsupported HeroUI imports or fictional library APIs remain.
- Desktop, tablet, and mobile navigation have documented behavior.
- All interactive controls have visible focus, accessible names, and minimum 44px touch targets where appropriate.
- Light/dark and reduced-motion behavior are implemented from semantic tokens.
- No new UI dependency is added without a one-page capability, accessibility, bundle, licensing, and ownership review.

## Superseded as implementation authority

- `Docs/Frontend UI Component Tree.md`: retain as historical/aspirational information architecture only; its WordPress/shadcn implementation is not current.
- `Prism Working/DESIGN_PROPOSAL.md`: retain the UX goals and token ideas, but its shadcn-specific roadmap/conclusion conflicts with the HeroUI v2 decision and cannot direct implementation.
- `Prism Working/IMPLEMENTATION_DEV_TABLE.md` and `UI_LIBRARY_MAPPING_TABLE.md`: replace references to non-existent HeroUI layout/sidebar APIs with the ownership model above.
