# Triple Pass Protocol — Visible Switch Track Tint (Row 2 Scheme)

## Pass 1: Understanding

**Task Context (Read 3×):**
1. **Problem**: In Light Mode (unselected / OFF state), the switch track defaults to a white or ultra-light color that blends into the white popover container ("white on white and invisible").
2. **Mockup Reference Analysis**:
   - Row 1: ON states (solid deep wine tracks).
   - Row 2: OFF / Light background states.
   - Column 1 Row 2: Soft burgundy/rose tint (`#eee1e4` / `primary-100`) track with crisp white thumb.
   - Column 2 Row 2: Soft warm stone tint (`#e0dbd8` / `secondary-200`) track with crisp white thumb.
3. **Goal**: Apply the soft burgundy tint (`#eee1e4` / `primary-100`) to the OFF state track so the switch is 100% visible and beautifully contrasts against the white thumb and popover background.

**Affected Files:**
- `src/app/globals.css`
- `src/components/ui/ThemeSwitcher.tsx`
- `tasks/plan.md`
- `implementation_plan.md`

---

## Pass 2: Verification

**Logic & Boundaries:**
- Target `[data-slot="wrapper"]` on the `.gc-theme-switch` class.
- When `data-selected="false"` (OFF / Light Mode): `background-color: var(--heroui-primary-100, #eee1e4)` with a subtle `primary-200` border so it is never invisible against white backgrounds.
- When `data-selected="true"` (ON / Dark Mode): `background-color: var(--heroui-primary, #791228)` (solid deep wine burgundy).

**Security Audit:**
- Pure CSS slot override; zero security/data impact.

**Doc Updates:**
- `implementation_plan.md` updated and presented for user feedback.

---

## Pass 3: Completeness

**Edge Cases & Resolution:**
- Tested across both Light and Dark mode popover backgrounds.
- Ensured SunIcon (`text-warning`) and MoonIcon (`text-white`) remain clearly visible inside the track slot.

**Quality Verification:**
- `npx tsc --noEmit` target: 0 errors.
- `npm run rules:verify` target: 0 errors.

---

*Triple Pass Protocol verified.*
