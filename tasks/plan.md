# Triple Pass Protocol — UI Architecture Design Lock & HeroUI Component Integration

## Pass 1: Understanding

**Task Context (Read 3×):**
1. User identified discrepancies in component usage: custom HTML `<button>` elements were used inside Popover instead of official HeroUI v2 components (`Dropdown`, `DropdownMenu`, `Switch`, `User`, `Avatar`).
2. User provided exact HeroUI code samples for:
   - `<Dropdown backdrop="blur">` with `<DropdownMenu variant="faded">`
   - HeroUI `<Switch>` with custom SVG `SunIcon` and `MoonIcon`
   - HeroUI `<Dropdown>` with `<User as="button" avatarProps={{ isBordered: true, color: "primary" }} />`
3. User mandated an immutable **Design Lock** (`DESIGN_LOCK.md`) to freeze the design tokens, component library rules, and theme matrix so no unauthorized refactors occur.
4. User provided mockup images of HeroUI theme generator to be archived in `Prism Working/GhostCart Themes/`.

**Affected Files:**
1. `Prism Working/DESIGN_LOCK.md` — New design lock policy document.
2. `src/components/ui/ThemeSwitcher.tsx` — Dropdown backdrop="blur", variant="faded", Switch with SunIcon/MoonIcon.
3. `src/components/layout/TopNav.tsx` — User Profile dropdown with HeroUI User component.
4. `Prism Working/GhostCart Themes/*` — Image mockups repository.
5. `.logs/errors.md` — Post-mortem and incident register for CSS compiler error ERR-033.

---

## Pass 2: Verification

**Logic & Boundaries:**
- **HeroUI Dropdown vs Popover**: HeroUI `<Dropdown>` provides built-in menu semantics (`variant="faded"`, `selectionMode="single"`, `DropdownSection showDivider`). Placing `<Switch>` in a `<DropdownItem closeOnSelect={false} isReadOnly>` ensures the menu stays open during mode toggles without closing.
- **TopNav User Component**: HeroUI `<User>` accepts `avatarProps`, `name`, and `description`. It integrates with NextAuth's `useSession` hook to render authenticated email/name with fallbacks.
- **Design Lock Enforceability**: Clear constraints documented in `DESIGN_LOCK.md` establishing HeroUI v2 as the mandatory component layer and freezing theme matrix tokens.

**Security Audit:**
- No user-input injection vectors.
- NextAuth `signOut` callback URL securely configured to `/sign-in`.
- Avatar image URLs strictly sanitized.

**Doc Updates:**
- Created `Prism Working/DESIGN_LOCK.md`.
- Updated `.logs/errors.md` with `ERR-033`.
- Updated `walkthrough.md`.

---

## Pass 3: Completeness

**Edge Cases & Resolution:**
- **TypeScript Type Safety**: Ensured `onSelectionChange` handles `Key` vs `BaseTheme` string conversions cleanly without `TS2367` type overlap warnings.
- **Responsive Layout**: On mobile/tablet screens, TopNav User name and description hide smoothly (`hidden sm:inline`, `hidden lg:inline`) to prevent navigation bar wrapping.
- **Theme Matrix Consistency**: Active theme selection maintains visual high-contrast indicators across both Default and Cream & Burgundy modes.

**Quality Verification:**
- `npx tsc --noEmit` -> Exited 0 (zero errors).
- `npm run rules:verify` -> Compliance check passed.

---

*Triple Pass Protocol verified and logged.*
