# Approved Implementation Brief — GhostCart UI Architecture

**Date:** 2026-08-19  
**Status:** APPROVED & LOCKED  
**Authority:** Replaces contradictory components or roadmap sections in other design files in `Prism Working` or `Docs`.

---

## 1. Technical Stack & Baseline

| Concern | Approved Selection | Version | Note |
|---|---|---|---|
| **Core Framework** | Next.js App Router | `14.2.5` | Standard standalone React delivery (no WordPress dependencies). |
| **View Layer** | React | `18.3.1` | Maintains compatibility with all backend testing suites. |
| **Primitives Library** | HeroUI v2 | `2.8.10` | Interactive primitives (dropdowns, modals, select, tables, buttons). |
| **Styling** | Tailwind CSS | `v3` | Utility class framework. |
| **Icons** | Lucide React | Latest | Standard icon library for operational controls. Emojis deprecated. |
| **Motion** | CSS first; Framer Motion | 11.0.0 | Respect reduced motion rules. Use only to convey state changes. |

---

## 2. Design Philosophy: The "Island UI"

GhostCart is a B2B operations workspace. Its visual tone is analytical, calm, and structured:

- **Warm Cream & Burgundy Color Palette**:
  - Background Canvas: `#f3f1ef` (Warm cream)
  - Card/Container Borders: `#e0dbd8` (Whisper-weight dividing lines)
  - Primary Active/Brand Accent: `#791228` (Deep Burgundy)
  - Hover/Darker Active Accent: `#55121e` (Muted dark burgundy)
  - Text & Charcoal Elements: `#0d0d0d` (High contrast near-black)
- **Floating Island Elements**:
  - Content sections, search palettes, and cards hover visually above the background.
  - Buttons and interactive inputs use clean border lines and high-contrast styling instead of flat default backgrounds.
  - Disabled controls must explicitly guarantee high contrast (e.g. solid `#e0dbd8` background with `#6b7280` text) to remain readable on light surfaces.

---

## 3. UI Component Ownership Model

To prevent breaking layout rules when updating third-party libraries:

1. **App Shell & Layout**: Owned by GhostCart. Built with semantic HTML elements (`header`, `aside`, `main`) and CSS Grid / Flexbox. Do not import generic shell layouts.
2. **Interactive Primitives**: Imported from `@heroui/react` (using v2 APIs). Includes Tables, Dropdowns, Tabs, Modals, Inputs, and Badges.
3. **Domain/Product Primitives**: Custom wrappers inside `src/components/ui/` or specialized modules (e.g. `ProductCard`, `MarginCalculator`, `ConfidenceIndicator`). Must pass strict form semantics (`type`, `name`, `disabled`).

---

## 4. Documentation Status Matrix

- **`Prism Working/UI_RECOVERY_BRIEF.md`**: ACTIVE — Direct instruction sheet for fixing the compilation layout.
- **`Prism Working/DASHBOARD_STRATEGY_DECISION_MATRIX.md`**: ACTIVE — Confirms the baseline stack and lock policy.
- **`Docs/Frontend UI Component Tree.md`**: HISTORICAL/ASPIRATIONAL — The WordPress plugin layout and ~30 screen outline are deprecated future visions.
- **`Prism Working/DESIGN_PROPOSAL.md`**: SUPERSEDED IN PART — Sections recommending `shadcn/ui` are deprecated; the UX goals and color values remain active.
- **`Prism Working/APPROVED_IMPLEMENTATION_BRIEF.md`** (This file): ACTIVE — Consolidated primary authority for UI development.
