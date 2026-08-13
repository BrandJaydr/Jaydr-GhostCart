# Dashboard Strategy Decision Matrix

**Decision date:** 2026-08-12  
**Current verified baseline:** Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10. Tailwind v3 is intended by configuration but is not currently installed at the repository root.

| Option | Additional cash cost | Expected engineering time | Delivery risk | Fit for GhostCart | Decision |
|---|---:|---:|---|---|---|
| Repair the current HeroUI v2 UI | $0 in new UI licenses | 3–5 days for a compiling shell and tokens; 1–2 weeks for the first tested workflow | Low–medium | Strong: preserves Next 14/React 18, limits the work to import → review → listing draft, and fixes the actual ownership failure | **Recommend now** |
| Migrate to Apex or Zenith | Template license plus migration labor | 2–4 weeks for stack upgrade, template extraction, auth/API integration, and regression testing | High | Moderate visual fit, poor technical fit today: both target Next 16, React 19, Tailwind v4, and shadcn/Radix | Use only as a parallel reference/prototype |
| Upgrade to HeroUI v3 | Upgrade/testing labor; no template license required for core library | 2–3 weeks for React 19 + Tailwind v4 upgrade, component rewrite, and regression/accessibility testing | High | Potentially strong long-term fit, but HeroUI v3 requires React 19 and Tailwind v4; it cannot rescue the current broken shell quickly | Reassess after a working v2 vertical slice |

## Why this decision

The urgent failure is not a lack of dashboard pages; it is an invalid library contract (`Layout.*`, `AppShell`, and `Sidebar` were assumed to exist in HeroUI v2). A template migration changes framework, React version, Tailwind version, and component foundation simultaneously, making diagnosis and delivery slower.

Repair uses a small ownership model: GhostCart-owned semantic HTML + Tailwind for `AppShell`/navigation; HeroUI v2 only for verified inputs, menus, dialogs, tables, and buttons; Lucide for icons; CSS/Framer Motion only for stateful motion. It is the smallest reversible path to a usable operations workspace.

## Template research notes

Flux, Apex, and Zenith current releases are dashboard starters built around Next.js 16, React 19, Tailwind CSS v4, and shadcn/Radix. Apex and Zenith are useful references for information architecture, tables, filtering, theme controls, and component documentation—but are not safe drop-in dependencies for this repository. [Flux documentation](https://flux-dashboard.pages.dev/docs) · [Apex documentation](https://apex-dashboard.pages.dev/docs/getting-started) · [Zenith documentation](https://zenith-dashboard.pages.dev/docs)

## Re-evaluation trigger

Re-open the migration/upgrade decision only after the UI recovery gate passes: TypeScript and lint are green; a global token layer exists; keyboard/mobile shell behavior is tested; and the import → review → listing-draft workflow operates against real API states.
