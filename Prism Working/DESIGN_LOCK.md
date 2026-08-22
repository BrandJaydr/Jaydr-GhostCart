# 🔒 GhostCart UI Architecture & Design Lock

**Lock Version**: 1.0.0  
**Effective Date**: 2026-08-22  
**Status**: ACTIVE & MANDATORY  
**Target Framework**: HeroUI (NextUI) v2.8.10 + Tailwind CSS 3.4.19 + Next.js 14 App Router

---

## 🎯 Purpose & Policy

This document establishes an **immutable Design Lock** for the GhostCart platform. Agents and developers must NOT refactor, replace, or unilaterally alter authorized UI architecture, component patterns, or design tokens without explicit user approval.

---

## 🧱 1. Component Library Architecture

1. **Primary Component Engine**: **HeroUI v2.8.10** (`@heroui/react`).
2. **NO Unauthorized Substitutions**: 
   - Never replace HeroUI components with raw unstyled HTML elements (`<button>`, `<select>`, `<input>`) when official HeroUI components exist (`Button`, `Dropdown`, `Select`, `Input`, `Tabs`, `Chip`, `Switch`, `Avatar`, `User`, `Popover`, `Listbox`).
   - Never replace HeroUI with Radix UI, Headless UI, or raw Tailwind recreations.
3. **Component Variants**:
   - Utilize HeroUI's native component variant hierarchy (`solid`, `bordered`, `flat`, `faded`, `shadow`, `light`, `ghost`) which automatically derive styles from the 50–900 shade matrix.

---

## 🎨 2. Theme & Colorway Architecture

1. **Active Base Themes**:
   - **Default**: HeroUI default slate/neutral base with primary blue accents (`#006FEE`).
   - **Cream & Burgundy**: Custom palette governed by `Prism Working/GhostCart Themes/Cream and burgundy Theme Stylings -HeroU.json`:
     - **Primary / Default**: Deep rich burgundy and wine tones (`#791228`, `#55121e`).
     - **Secondary / Success**: Warm neutral cream and off-white tints (`#e0dbd8`, `#f3f1ef`).
     - **Warning**: Slate gray scale (`#6b7280`).
     - **Danger**: Cerise / Magenta accents (`#f31260`).
2. **Dual Mode per Theme**:
   - Each base theme supports **Light Mode** and **Dark Mode**.
   - Switching mode or theme must NEVER break contrast or invert readability.
3. **No Raw CSS Variable Breakage**:
   - Do NOT pass slash opacity modifiers (e.g., `bg-background/90`) to Tailwind `@apply` when targeting CSS variables. Use native `color-mix(in srgb, var(...), transparent)` or HeroUI's native opacity tokens.

---

## 🧭 3. Locked Layout & Navigation Components

### A. TopNav Theme Switcher
- **Structure**:
  ```
  [Theme Dropdown Button (backdrop="blur")]
  ├── THEME SECTION (variant="faded")
  │   ├── Default
  │   ├── Cream & Burgundy
  │   ├── Coming Soon (faded / disabled)
  │   └── Coming Soon (faded / disabled)
  ├── DIVIDER
  └── MODE TOGGLE
      └── Dark Mode / Light Mode (HeroUI Switch with SunIcon & MoonIcon)
  ```

### B. TopNav User Profile Dropdown
- **Structure**:
  ```
  [HeroUI User / Avatar with isBordered & color="primary"]
  ├── PROFILE INFO ("Signed in as [email]")
  ├── My Settings (/settings/general)
  ├── Marketplace Integrations (/settings/marketplaces)
  ├── Supplier Adapters (/settings/suppliers)
  ├── Job Activity & Analytics (/jobs)
  └── Log Out (color="danger", calls next-auth signOut)
  ```

### C. Sidebar & Command Palette
- **Sidebar**: Floating island container (`bg-surface border border-border shadow-md`), active items use `bg-primary text-primary-foreground`, hover items use soft `primary-10` tint with 2px theme border.
- **Command Palette**: HeroUI styled modal with `backdrop="blur"`, `bg-background/90`, dynamic item hover and selection states.

---

## 🛡️ 4. Modification Protocol

Before modifying any component or style covered by this lock:
1. Confirm compatibility with HeroUI v2 component APIs.
2. Run Triple Pass Protocol: Understanding → Verification → Completeness.
3. Pass all quality gates: `npx tsc --noEmit` (0 errors) and `npm run rules:verify`.
4. Never delete or deprecate locked features without explicit instruction.
