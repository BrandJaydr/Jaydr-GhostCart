# GhostCart Design Tokens

> **Author:** PRISM (Design System Agent)
> **Date:** 2026-08-11
> **Purpose:** Centralized design system tokens for GhostCart application
> **Status:** Phase 1 - Initial Implementation

> **IMPLEMENTATION NOTICE (2026-08-12):** These are proposed tokens, not active application CSS. Verified baseline: **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10**; Tailwind v3 is intended but the package is missing. Activate and validate this token layer through the UI recovery gate before treating it as a shipped design system.

---

## Color System

### Primary Colors (Burgundy Palette)
```typescript
primary: {
  50: '#fef0f2',   // Lightest pink/burgundy tint
  100: '#fde0e5',  // Very light burgundy tint
  200: '#fbbfc8',  // Light burgundy tint
  300: '#f79aa8',  // Medium light burgundy
  400: '#f16f84',  // Medium burgundy
  500: '#791228',  // Primary Burgundy Brand
  600: '#55121e',  // Deep Burgundy Accent
  700: '#420d16',  // Dark burgundy
  800: '#2d090f',  // Very dark burgundy
  900: '#1a0508',  // Darkest burgundy
}
```

### Neutral & Surface Colors (Warm Cream Palette)
```typescript
neutral: {
  50: '#f9fafb',
  100: '#f3f1ef',  // Base Background (Warm Cream)
  200: '#e0dbd8',  // Subtle Surface & Border Contrast
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',  // Muted Foreground Text
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#0d0d0d',  // Foreground Text (Near Black)
}
```

### Semantic Surface Tokens
```typescript
theme: {
  background: '#f3f1ef',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  foreground: '#0d0d0d',
  mutedForeground: '#6b7280',
  border: '#e0dbd8',
}
```

---

## Typography

### Font Families
```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
}
```

### Font Sizes
```typescript
fontSize: {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem',    // 48px
}
```

### Font Weights
```typescript
fontWeight: {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

### Line Heights
```typescript
lineHeight: {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
}
```

---

## Spacing Scale (8px Grid)

```typescript
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
}
```

---

## Border Radius

```typescript
borderRadius: {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.375rem', // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
}
```

---

## Shadows

```typescript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}
```

---

## Transitions

```typescript
transitionDuration: {
  fast: '150ms',
  DEFAULT: '200ms',
  slow: '300ms',
}

transitionTimingFunction: {
  DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
}
```

---

## Z-Index Scale

```typescript
zIndex: {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
}
```

---

## Breakpoints

```typescript
breakpoints: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

---

## Component-Specific Tokens

### Sidebar
```typescript
sidebar: {
  width: '260px',
  collapsedWidth: '64px',
  backgroundColor: '#1f2937', // neutral-800
  textColor: '#f3f4f6', // neutral-100
  activeBackgroundColor: '#374151', // neutral-700
}
```

### TopNav
```typescript
topnav: {
  height: '64px',
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb', // neutral-200
}
```

### Buttons
```typescript
button: {
  primary: {
    backgroundColor: '#791228', // primary-500
    hoverColor: '#55121e', // primary-600
    textColor: '#ffffff',
    disabledBackgroundColor: '#e0dbd8', // neutral-200 / surface border
    disabledTextColor: '#6b7280', // neutral-500 muted text
  },
  secondary: {
    backgroundColor: '#e0dbd8',
    hoverColor: '#d1d5db',
    textColor: '#0d0d0d',
  },
  danger: {
    backgroundColor: '#ef4444',
    hoverColor: '#dc2626',
    textColor: '#ffffff',
  },
}
```

---

## Usage in Components

### TypeScript Implementation
```typescript
// lib/theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#f0f9ff',
      500: '#0ea5e9',
      600: '#0284c7',
      // ... rest of color scale
    },
    // ... other colors
  },
  spacing: {
    1: '0.25rem',
    2: '0.5rem',
    // ... rest of spacing scale
  },
  // ... other tokens
}
```

### Tailwind CSS Configuration
```javascript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // ... other colors
      },
      spacing: {
        1: '0.25rem',
        2: '0.5rem',
        // ... rest of spacing scale
      },
      // ... other extensions
    },
  },
}
```

---

## Version History

- **v1.0** (2026-08-11): Initial design token system for Phase 1 layout infrastructure

---

*End of GhostCart Design Tokens*
