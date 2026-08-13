# UI Sandbox Setup Guide

> **Author:** PRISM (Design System Agent)
> **Date:** 2026-08-11
> **Purpose:** Complete setup instructions for the GhostCart UI component sandbox

---

## Overview

The UI sandbox is a local development environment for testing and developing UI components using HeroUI, MagicUI, and Lightswind UI libraries. It is hidden from GitHub via `.gitignore` and serves as a staging area for component development before integration into the main application.

## Directory Structure

```
Prism Working/
├── ui-sandbox/                    # Hidden from GitHub
│   ├── package.json              # Local npm package configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   ├── components/               # Component development area
│   │   ├── heroui/              # HeroUI component adaptations
│   │   ├── magicui/             # MagicUI component adaptations
│   │   ├── lightswind/          # Lightswind UI component adaptations
│   │   └── custom/              # Custom GhostCart components
│   ├── lib/                     # Shared utilities
│   │   ├── theme.ts             # Design tokens
│   │   └── utils.ts             # Helper functions
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript type definitions
│   └── tests/                   # Component tests
├── FRONTEND_DEVELOPMENT_PLAN.md  # Main planning document
├── UI_LIBRARY_MAPPING_TABLE.md   # Component mapping table
├── IMPLEMENTATION_DEV_TABLE.md   # Feature implementation table
└── SANDBOX_SETUP_GUIDE.md        # This file
```

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Git (for version control)
- Basic knowledge of React and TypeScript

## Installation Steps

### Step 1: Navigate to Sandbox Directory

```bash
cd "c:\Users\jayst\Documents\GitHub\Jaydr GhostCart\Prism Working\ui-sandbox"
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- HeroUI v2 (@heroui/react@^2.2.0)
- React and React DOM
- Next.js
- Framer Motion
- TypeScript and development dependencies

**Important:** HeroUI v3 requires React 19+, but the project uses React 18.3.1. HeroUI v2 supports React 18+ and will be installed with `--legacy-peer-deps` flag to handle peer dependency warnings.

### Step 3: Verify Installation

```bash
npm test
```

Run the test suite to verify all dependencies are installed correctly.

## Configuration Files

### package.json

The sandbox uses a local npm package configuration:

```json
{
  "name": "@ghostcart/ui-sandbox",
  "version": "1.0.0",
  "private": true,
  "description": "UI component sandbox for Jaydr GhostCart",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .ts,.tsx",
    "test": "vitest",
    "test:watch": "vitest --watch"
  },
  "dependencies": {
    "@heroui/react": "^2.2.0",
    "framer-motion": "^11.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next": "^14.2.0"
  }
}
```

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Tailwind CSS Configuration

Create `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // GhostCart brand colors
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

## Component Development Workflow

### 1. Create New Component

**For HeroUI components:**
```bash
# Navigate to HeroUI components directory
cd components/heroui

# Create new component file
New-Item -ItemType File -Path "Button.tsx"
```

**For MagicUI components:**
```bash
# Navigate to MagicUI components directory
cd components/magicui

# Copy component from MagicUI documentation
# Adapt to GhostCart design tokens
```

**For custom components:**
```bash
# Navigate to custom components directory
cd components/custom

# Create custom component
New-Item -ItemType File -Path "GhostCard.tsx"
```

### 2. Component Template

```typescript
import { Button as HeroUIButton } from '@heroui/react'

interface GhostCartButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  isLoading?: boolean
  children: React.ReactNode
  onClick?: () => void
}

export const GhostCartButton = ({
  variant = 'primary',
  isLoading = false,
  children,
  onClick,
}: GhostCartButtonProps) => {
  const colorMap = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'danger',
  }

  return (
    <HeroUIButton
      color={colorMap[variant]}
      isLoading={isLoading}
      onPress={onClick}
    >
      {children}
    </HeroUIButton>
  )
}
```

### 3. Test Component

Create test file in `tests/` directory:

```typescript
import { render, screen } from '@testing-library/react'
import { GhostCartButton } from '../components/custom/GhostCard'

describe('GhostCartButton', () => {
  it('renders children correctly', () => {
    render(<GhostCartButton>Click me</GhostCartButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<GhostCartButton isLoading>Loading</GhostCartButton>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 4. Run Tests

```bash
npm test
```

## Design Tokens Setup

### Create Theme Configuration

Create `lib/theme.ts`:

```typescript
export const theme = {
  colors: {
    primary: {
      light: '#0ea5e9',
      DEFAULT: '#0284c7',
      dark: '#0369a1',
    },
    secondary: {
      light: '#8b5cf6',
      DEFAULT: '#7c3aed',
      dark: '#6d28d9',
    },
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
}
```

## Integration with Main Application

### Step 1: Export Components

Create `components/index.ts`:

```typescript
// HeroUI Components
export { Button } from './heroui/Button'
export { Input } from './heroui/Input'
export { Card } from './heroui/Card'

// Custom Components
export { GhostCartButton } from './custom/GhostCard'
export { ProductCard } from './custom/ProductCard'
```

### Step 2: Copy to Main Application

When components are ready for production:

```bash
# Copy components to main application
Copy-Item -Path "components\custom\*" -Destination "..\..\src\components\ui\" -Recurse
```

### Step 3: Update Main Application Dependencies

Add required dependencies to main `package.json`:

```bash
cd ../..
npm install @heroui/react@^2.2.0 --legacy-peer-deps framer-motion
```

## Development Workflow

### Daily Development

1. **Start development server:**
   ```bash
   cd Prism Working/ui-sandbox
   npm run dev
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Lint code:**
   ```bash
   npm run lint
   ```

### Component Development

1. **Create component** in appropriate directory
2. **Write tests** for the component
3. **Test component** in isolation
4. **Document component** usage
5. **Integrate** with main application when ready

### Code Quality

- **TypeScript:** Strict mode enabled
- **Linting:** ESLint with Next.js rules
- **Testing:** Vitest with React Testing Library
- **Formatting:** Prettier (configured in parent project)

## Troubleshooting

### Common Issues

**Issue:** Module not found errors
**Solution:** Ensure dependencies are installed: `npm install`

**Issue:** TypeScript errors
**Solution:** Check `tsconfig.json` paths configuration

**Issue:** Tailwind CSS not working?
**Solution:** Verify `tailwind.config.ts` content paths

**Issue:** HeroUI components not styling correctly
**Solution:** Ensure HeroUI provider is set up in layout

### Getting Help

1. Check documentation in `Prism Working/` directory
2. Review HeroUI documentation: https://heroui.com/docs/react
3. Review MagicUI documentation: https://magicui.design/docs
4. Review Lightswind UI documentation: https://lightswind.com

## Best Practices

### Component Development
- Use TypeScript for all components
- Write tests for all new components
- Follow existing component patterns
- Document component props and usage
- Keep components focused and reusable

### Performance
- Use tree-shaking for library imports
- Lazy load heavy components
- Optimize images and assets
- Monitor bundle size

### Accessibility
- Ensure keyboard navigation works
- Add ARIA labels where needed
- Test with screen readers
- Follow WCAG 2.1 AA guidelines

## Cleanup and Maintenance

### Regular Cleanup

```bash
# Clean node_modules if needed
Remove-Item -Recurse -Force node_modules
npm install

# Clean build artifacts
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force dist
```

### Dependency Updates

```bash
# Check for outdated packages
npm outdated

# Update packages (carefully)
npm update
```

## Security Considerations

- The sandbox is hidden from GitHub via `.gitignore`
- Never commit sensitive data or API keys
- Keep dependencies updated for security patches
- Review dependency vulnerabilities regularly

## Next Steps

1. **Set up development environment** using this guide
2. **Review existing components** in the sandbox
3. **Start with Phase 1 components** from the implementation table
4. **Follow the phased development plan** in FRONTEND_DEVELOPMENT_PLAN.md
5. **Coordinate with other agents** using the handoff system

---

*End of Sandbox Setup Guide*