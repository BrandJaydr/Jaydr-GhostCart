# UI Library Component Mapping Table

> **Author:** PRISM (Design System Agent)
> **Date:** 2026-08-11
> **Purpose:** Map HeroUI, MagicUI, and Lightswind UI components to GhostCart features

> **ACTIVE IMPLEMENTATION NOTICE (2026-08-12):** Verified baseline: **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10, Tailwind CSS v4.3.3**. All dependencies are installed and configured. `UI_RECOVERY_BRIEF.md` governs implementation. Do not represent unverified library capabilities as available.

---

## Library Overview

### HeroUI v2 (Primary Component Library)
- **Strengths:** Production-ready interactive primitives with React Aria accessibility foundations; compatible with the project's React 18 baseline
- **Best For:** Core UI components, forms, data tables, navigation
- **Integration:** Zero boilerplate, no Provider wrapper needed, tree-shakeable packages
- **React 18 Compatibility:** HeroUI v2 supports React 18+ (project uses React 18.3.1)
- **Installation:** `npm install @heroui/react@^2.2.0 --legacy-peer-deps`
- **Note:** HeroUI v3 requires React 19+, but project uses React 18.3.1. Using v2 for compatibility.

### MagicUI (Animation Focus)
- **Strengths:** 150+ animated components, copy-paste approach, perfect companion to HeroUI
- **Best For:** Animations, visual effects, landing page elements
- **Integration:** Copy-paste architecture, works with HeroUI components
- **React 18 Compatibility:** Fully compatible with React 18+

### Lightswind UI (Advanced/3D Focus)
- **Strengths:** 169+ components, 3D elements, WebGL, MCP integration, strict TypeScript
- **Best For:** Advanced visual effects, 3D components, high-performance layouts
- **Integration:** CLI setup, universal dark mode, 100/100 Core Web Vitals
- **React 18 Compatibility:** Explicitly requires React 18+ (perfect fit for project)

---

## Component Category Mapping

### Layout Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| App Shell | **Custom: GhostCart semantic HTML + Tailwind** | - | - | Dashboard shell | CRITICAL |
| Sidebar | **Custom: GhostCart `Sidebar`** | - | - | Navigation panel | CRITICAL |
| Top Navigation | Navbar | - | - | User menu, search | CRITICAL |
| Breadcrumbs | Breadcrumbs | - | - | Page navigation | HIGH |
| Resizable Panels | - | - | Resizable | Split views | MEDIUM |
| Scroll Area | - | - | Scroll Area | Long content | MEDIUM |

### Navigation Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Tabs | Tabs | - | - | Tabbed content | HIGH |
| Menu | Dropdown Menu | - | Dropdown Menu | Context menus | HIGH |
| Pagination | Pagination | - | - | Data tables | HIGH |
| Stepper | Stepper | - | - | Multi-step forms | MEDIUM |

### Button Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Primary Button | Button | Button | - | Main actions | CRITICAL |
| Secondary Button | Button (variant) | Button | - | Secondary actions | CRITICAL |
| Icon Button | IconButton | - | - | Toolbars | HIGH |
| Loading Button | Button (isLoading) | - | - | Async actions | HIGH |
| Danger Button | Button (color="danger") | - | - | Destructive actions | MEDIUM |

### Form Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Text Input | Input | Input | Form Controls | Data entry | CRITICAL |
| Select | Select | - | - | Dropdowns | CRITICAL |
| Checkbox | Checkbox | - | - | Multi-select | HIGH |
| Radio | Radio | - | - | Single select | HIGH |
| Textarea | Textarea | - | - | Long text | HIGH |
| Form Validation | Form | - | - | Form handling | HIGH |
| Date Picker | DatePicker | - | - | Date selection | MEDIUM |
| File Upload | - | - | - | File uploads | MEDIUM |

### Data Display Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Table | Table | - | - | Data tables | CRITICAL |
| Card | Card | - | Card | Content containers | CRITICAL |
| Badge | Badge | Badge | Badge | Status indicators | HIGH |
| List | List | - | - | Item lists | HIGH |
| Grid | Grid | - | - | Layout grids | HIGH |
| Avatar | Avatar | - | - | User avatars | MEDIUM |
| Progress | Progress | - | - | Progress bars | MEDIUM |

### Feedback Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Spinner | Spinner | - | - | Loading states | CRITICAL |
| Skeleton | Skeleton | - | Skeleton | Content loading | CRITICAL |
| Alert | Alert | - | Alert Dialog | Notifications | HIGH |
| Toast | Toast | - | - | Toast notifications | CRITICAL |
| Progress Bar | Progress | - | - | Task progress | MEDIUM |

### Overlay Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Modal | Modal | Dialog | Popover | Dialogs | CRITICAL |
| Dialog | Dialog | Dialog | - | Confirmations | HIGH |
| Popover | Popover | - | Popover | Tooltips | HIGH |
| Tooltip | Tooltip | - | Tooltip | Help text | MEDIUM |
| Drawer | - | - | - | Side panels | MEDIUM |

### Animation Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Animated List | - | Animated List | - | List animations | MEDIUM |
| Marquee | - | Marquee | - | Scrolling text | LOW |
| 3D Elements | - | - | 3D Elements | Visual effects | LOW |
| Background Effects | - | Backgrounds | Backgrounds | Page backgrounds | LOW |

### Typography Components

| Component Category | HeroUI Component | MagicUI Component | Lightswind Component | GhostCart Usage | Priority |
|-------------------|------------------|------------------|---------------------|-----------------|----------|
| Heading | Text | - | - | Page titles | CRITICAL |
| Body Text | Text | - | - | Content | CRITICAL |
| Code | Code | - | - | Code blocks | MEDIUM |
| Link | Link | - | - | Navigation | HIGH |

---

## Recommended Component Strategy

### Primary Library: HeroUI
**Use for:**
- All core UI components (buttons, forms, inputs)
- Layout components (app shell, sidebar, navigation)
- Data display (tables, cards, badges)
- Feedback components (spinners, alerts, toasts)
- Overlay components (modals, dialogs, popovers)

**Rationale:**
- Production-ready with comprehensive component set
- Built-in accessibility (React Aria)
- No Provider wrapper needed
- AI-native with MCP server integration
- Excellent TypeScript support

### Secondary Library: MagicUI
**Use for:**
- Animation effects and transitions
- Visual enhancements
- Landing page elements
- Interactive backgrounds

**Rationale:**
- Complements HeroUI with animation focus
- Copy-paste approach for easy integration
- 150+ animated components
- Perfect for visual polish

### Tertiary Library: Lightswind UI
**Use for:**
- Advanced 3D components (when needed)
- High-performance layout components
- WebGL effects (rare cases)
- Specialized visual effects

**Rationale:**
- Advanced capabilities for specific use cases
- High-performance components
- MCP integration for AI assistance
- Use sparingly for performance optimization

---

## Component Integration Guidelines

### Installation Order
1. **HeroUI v2** - Install first as primary library with `npm install @heroui/react@^2.2.0 --legacy-peer-deps`
2. **MagicUI** - Install second for animations (copy-paste approach)
3. **Lightswind UI** - Install third for advanced features (CLI setup)

### Component Selection Rules
- **Default to HeroUI** for all standard UI components
- **Use MagicUI** only when animation is required
- **Use Lightswind UI** only when 3D/performance is critical
- **Avoid mixing** similar components from different libraries

### Custom Component Layer
- Create custom components in `components/custom/`
- Wrap library components with GhostCart branding
- Implement consistent design tokens
- Add GhostCart-specific functionality

---

## Component Usage Patterns

### Form Pattern
```typescript
// HeroUI Form Pattern
import { Button, Input, Form } from '@heroui/react'

const ProductForm = () => {
  return (
    <Form>
      <Input label="Product Name" />
      <Input label="Price" type="number" />
      <Button type="submit">Save</Button>
    </Form>
  )
}
```

### Table Pattern
```typescript
// HeroUI Table Pattern
import { Table, Button } from '@heroui/react'

const ProductTable = () => {
  return (
    <Table>
      <Table.Header>
        <Table.Column>NAME</Table.Column>
        <Table.Column>PRICE</Table.Column>
        <Table.Column>ACTIONS</Table.Column>
      </Table.Header>
      <Table.Body>
        {/* Data rows */}
      </Table.Body>
    </Table>
  )
}
```

### Modal Pattern
```typescript
// HeroUI Modal Pattern
import { Modal, Button } from '@heroui/react'

const ProductModal = () => {
  return (
    <Modal>
      <Modal.Header>Edit Product</Modal.Header>
      <Modal.Body>
        {/* Form content */}
      </Modal.Body>
      <Modal.Footer>
        <Button>Save</Button>
        <Button variant="bordered">Cancel</Button>
      </Modal.Footer>
    </Modal>
  )
}
```

---

## Migration Strategy

### Phase 1: HeroUI Integration
- Replace existing stub components with HeroUI equivalents
- Implement AppShell, Sidebar, Navigation
- Set up design tokens and theme

### Phase 2: MagicUI Integration
- Add animation effects to key interactions
- Implement loading animations
- Add visual polish to landing pages

### Phase 3: Lightswind UI Integration
- Add 3D components where beneficial
- Implement high-performance layouts
- Add specialized visual effects

---

## Performance Considerations

### Tree Shaking
- Use individual component imports from HeroUI
- Lazy load MagicUI components
- Load Lightswind UI components on-demand

### Bundle Size
- Monitor bundle size with each library addition
- Implement code splitting for large components
- Use dynamic imports for non-critical animations

### Runtime Performance
- Prefer HeroUI for performance-critical components
- Use CSS animations over JavaScript when possible
- Implement proper loading states for all async operations

---

*End of UI Library Component Mapping Table*
