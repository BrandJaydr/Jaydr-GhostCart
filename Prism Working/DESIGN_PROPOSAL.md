# PRISM Design System Proposal
## Jaydr GhostCart - Stage 2 Design Foundation

**Agent:** Prism 🎨 - Design System & UI Architecture  
**Project:** Jaydr GhostCart - Enterprise Reseller & Dropshipping Automation Platform  
**Date:** 2026-08-10  
**Status:** Design Proposal - Ready for Review

> **IMPLEMENTATION STATUS — SUPERSEDED IN PART (2026-08-12):** This proposal remains useful for Mode A UX goals and token concepts, but its shadcn-specific roadmap/conclusion conflicts with the active HeroUI v2 decision. Verified baseline: **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10**; Tailwind v3 is intended but the dependency is missing. Use `UI_RECOVERY_BRIEF.md` and `DASHBOARD_STRATEGY_DECISION_MATRIX.md` for all implementation choices.

---

## 🎯 EXECUTIVE SUMMARY

### Current State Assessment
GhostCart is in **Stage 2** of a modular monolith delivery model. The project has:
- Functional Next.js 14.2 application with TypeScript
- PostgreSQL database with 11 migrations
- Basic UI component stubs (Button, Input, EmptyState, ErrorState, PageHeader, StatusBadge)
- Authentication infrastructure with NextAuth
- Real supplier adapters (CSV, eBay)
- AI-powered listing analysis capabilities

### Design System Gap
**Critical Gap:** No design system foundation exists. The current UI components are Stage 1 stubs with TODOs for styling and design tokens. The project lacks:
- Design token system (colors, typography, spacing, motion)
- Component library selection and integration
- Accessibility implementation
- Theme system (light/dark mode)
- Design documentation and patterns

### Recommendation
Establish a **Mode A (Enterprise/Professional)** design system foundation using **HeroUI v2** as the primary component library, with GhostCart-owned semantic tokens and a focused component layer optimized for dense, operational workflows.

**Note:** HeroUI v3 requires React 19+, but the project currently uses React 18.3.1. HeroUI v2 supports React 18+ and provides enterprise-grade components with React Aria accessibility. This decision aligns with FRONTEND_DEVELOPMENT_PLAN.md and maintains compatibility with the current React version.

---

## 🎨 DESIGN MODE DETERMINATION

### Mode A: Enterprise/Professional ✅

**Rationale:**
- **Target Users:** Enterprise applications, business software, SaaS platforms, dashboards, data-heavy applications
- **Design Objectives:** Professional, trustworthy, calm, structured, predictable, accessible, information-dense without overwhelming
- **Product Nature:** B2B automation platform for serious business operations
- **User Workflows:** Complex operational tasks requiring clarity, efficiency, and reliability

### Design Philosophy
> **Function first. Consistency second. Visual personality third.**

**Key Principles:**
- Avoid unnecessary animation, decorative effects, excessive gradients
- Prioritize clarity, efficiency, and operational excellence
- Design for dense, information-rich interfaces
- Make automation visible and explainable
- Ensure accessibility and keyboard navigation

---

## 🏗️ COMPONENT LIBRARY SELECTION

### Recommended: HeroUI v2

**Justification:**
1. **React 18 Compatibility:** HeroUI v2 supports React 18+ (project uses React 18.3.1), avoiding the React 19 upgrade requirement
2. **Enterprise-Grade:** Production-ready with React Aria accessibility foundation
3. **Alignment with Project Plan:** Matches FRONTEND_DEVELOPMENT_PLAN.md specification for HeroUI as primary library
4. **AI-Native:** Built-in MCP server integration for AI-assisted development
5. **Composition:** Excellent compound component API (Card.Header, Card.Content, etc.)
6. **Accessibility:** Built on React Aria with robust accessibility features
7. **Tailwind Integration:** Seamless Tailwind CSS v4 integration
8. **Zero Boilerplate:** No Provider wrapper needed, tree-shakeable packages

### Alternative Options (Evaluated but Not Recommended)

**React Spectrum (#1 in PRISM hierarchy):**
- ✅ Excellent accessibility and enterprise focus
- ❌ Heavy bundle size
- ❌ Less flexible customization
- ❌ Steeper learning curve
- ❌ Over-engineered for current Stage 2 needs

**React Aria (#2 in PRISM hierarchy):**
- ✅ Superior accessibility primitives
- ✅ Maximum customization flexibility
- ❌ Requires more custom implementation work
- ❌ Longer development time
- ❌ Higher maintenance burden

**shadcn/ui (#3 in PRISM hierarchy):**
- ✅ React 18 compatible
- ✅ Source-owned components with full customization
- ✅ Built on Radix UI primitives with robust accessibility
- ✅ Strong community and extensive component registry
- ❌ Was considered but HeroUI v2 chosen for better enterprise alignment with project plan
- ❌ Would require additional setup compared to HeroUI's zero-boilerplate approach

### Implementation Strategy
- Install HeroUI v2 with `--legacy-peer-deps` flag to handle peer dependency warnings
- Use HeroUI CLI for component management and documentation
- Implement GhostCart-specific semantic tokens
- Build internal component layer for domain-specific patterns
- Maintain MagicUI and Lightswind UI as secondary libraries for animations and advanced features

---

## 🎨 DESIGN TOKEN SYSTEM

### Color System (Semantic Tokens)

**Primary Palette - Professional Trust:**
```css
--color-primary: #0f172a;      /* Slate 900 - Professional dark */
--color-primary-foreground: #f8fafc; /* Slate 50 - Light text */
--color-secondary: #475569;    /* Slate 600 - Muted professional */
--color-secondary-foreground: #f8fafc;
--color-accent: #0ea5e9;       /* Sky 500 - Trustworthy blue */
--color-accent-foreground: #ffffff;
```

**Status Colors (Operational Clarity):**
```css
--color-success: #10b981;      /* Emerald 500 - Healthy/Active */
--color-warning: #f59e0b;      /* Amber 500 - Attention needed */
--color-error: #ef4444;        /* Red 500 - Critical/Failure */
--color-info: #3b82f6;         /* Blue 500 - Informational */
```

**Neutral System (Information Density):**
```css
--color-background: #ffffff;   /* Clean white background */
--color-surface: #f8fafc;       /* Slate 50 - Card surfaces */
--color-surface-elevated: #f1f5f9; /* Slate 100 - Elevated elements */
--color-foreground: #0f172a;   /* Slate 900 - Primary text */
--color-muted-foreground: #64748b; /* Slate 500 - Secondary text */
--color-border: #e2e8f0;        /* Slate 200 - Subtle borders */
```

### Typography System

**Font Selection:**
- **Display:** Inter (or similar professional sans-serif) for headings
- **Body:** System UI fonts for maximum performance and native feel
- **Code:** JetBrains Mono or similar for code/technical content

**Type Scale:**
```css
--font-size-display-xl: 2.5rem;   /* 40px - Page titles */
--font-size-display-lg: 2rem;     /* 32px - Section headers */
--font-size-display-md: 1.5rem;   /* 24px - Subsection headers */
--font-size-body-lg: 1.125rem;   /* 18px - Large body */
--font-size-body: 1rem;           /* 16px - Base body */
--font-size-body-sm: 0.875rem;    /* 14px - Small body */
--font-size-caption: 0.75rem;    /* 12px - Captions/labels */
```

**Font Weights:**
```css
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing System

**Consistent 4px Base Scale:**
```css
--spacing-0: 0;
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
```

### Radius System

**Professional, Subtle Radius:**
```css
--radius-sm: 0.25rem;   /* 4px - Small elements */
--radius-md: 0.375rem;  /* 6px - Default radius */
--radius-lg: 0.5rem;    /* 8px - Cards, containers */
--radius-xl: 0.75rem;   /* 12px - Large containers */
--radius-full: 9999px;  /* Pills, badges */
```

### Shadow System

**Subtle Elevation:**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Motion System

**Purposeful, Minimal Motion:**
```css
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;

--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

**Reduced Motion Support:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🧩 COMPONENT ARCHITECTURE

### Core Component Layer (Priority 1)

**Foundation Components (Immediate Implementation):**
1. **Button** - Primary, secondary, ghost, danger variants with loading states
2. **Input** - Text input with labels, error states, helper text
3. **Select** - Dropdown select with search capability
4. **Dialog** - Modal dialogs for confirmations and forms
5. **DataTable** - Sortable, filterable data tables with pagination
6. **StatusBadge** - Status indicators with color coding
7. **EmptyState** - Empty state placeholders with actions
8. **ErrorState** - Error presentation with retry mechanisms
9. **PageHeader** - Consistent page headers with action slots
10. **Spinner** - Loading indicators for async operations

### Layout Components (Priority 2)

**Navigation and Structure:**
1. **Sidebar** - Collapsible sidebar navigation
2. **TopNav** - Top navigation bar with user menu
3. **Breadcrumbs** - Breadcrumb navigation trails
4. **Tabs** - Tab navigation for content organization
5. **Card** - Content cards with consistent structure
6. **Separator** - Visual dividers and separators

### Domain-Specific Components (Priority 3)

**GhostCart-Specific Patterns:**
1. **ProductCard** - Product display with images, pricing, status
2. **ListingEditor** - Rich text editor for listing content
3. **PriceIndicator** - Price change indicators with trends
4. **HealthScore** - Account health visualization
5. **ActivityTimeline** - Activity feed and audit trail display
6. **BulkActionBar** - Bulk action controls for tables
7. **MarketplaceBadge** - Marketplace identification badges
8. **AutomationStatus** - Automation job status indicators

---

## ♿ ACCESSIBILITY STRATEGY

### WCAG 2.1 AA Compliance

**Keyboard Navigation:**
- All interactive elements keyboard accessible
- Visible focus indicators (custom focus rings)
- Logical tab order
- Skip navigation links
- Keyboard shortcuts for common actions

**Screen Reader Support:**
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Error announcements
- Status updates

**Visual Accessibility:**
- Color contrast ratio ≥ 4.5:1 for text
- Color contrast ratio ≥ 3:1 for large text
- Text resize support up to 200%
- No reliance on color alone for meaning
- Sufficient spacing for touch targets (44x44px minimum)

**Motion Accessibility:**
- Respect `prefers-reduced-motion` setting
- No flashing content (3 flashes/second limit)
- Pause controls for auto-playing content
- Warning before auto-updating content

---

## 📱 RESPONSIVE DESIGN STRATEGY

### Breakpoint System

**Mobile-First Approach:**
```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large desktop */
```

### Responsive Patterns

**Layout Adaptation:**
- Mobile: Single column, stacked layouts
- Tablet: Two-column layouts, collapsible sidebar
- Desktop: Multi-column layouts, persistent sidebar
- Large Desktop: Maximum information density

**Component Adaptation:**
- Tables: Card view on mobile, table view on desktop
- Navigation: Bottom nav on mobile, sidebar on desktop
- Forms: Stacked on mobile, grid layout on desktop
- Modals: Full-screen on mobile, centered dialog on desktop

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Week 1-2)

**Objective:** Establish design system infrastructure

**Tasks:**
1. Initialize shadcn/ui with enterprise preset
2. Implement design token system (CSS variables)
3. Configure Tailwind CSS with custom theme
4. Set up theme provider (light/dark mode)
5. Implement core accessibility utilities
6. Create design documentation structure

**Deliverables:**
- Working shadcn/ui installation
- Complete design token system
- Theme provider implementation
- Accessibility baseline established
- Design system documentation scaffold

### Phase 2: Core Components (Week 3-4)

**Objective:** Implement Priority 1 components

**Tasks:**
1. Implement Button component with all variants
2. Implement Input component with validation states
3. Implement Select component with search
4. Implement Dialog component for modals
5. Implement DataTable component with sorting/filtering
6. Implement StatusBadge component
7. Implement EmptyState and ErrorState components
8. Implement PageHeader component
9. Implement Spinner component

**Deliverables:**
- 9 core components fully implemented
- Component documentation and examples
- Accessibility testing completed
- Storybook or component preview setup

### Phase 3: Layout & Navigation (Week 5-6)

**Objective:** Implement Priority 2 components

**Tasks:**
1. Implement Sidebar component with collapsible navigation
2. Implement TopNav component with user menu
3. Implement Breadcrumbs component
4. Implement Tabs component
5. Implement Card component system
6. Implement Separator component
7. Implement responsive layout patterns

**Deliverables:**
- Complete layout component set
- Responsive navigation system
- Mobile navigation patterns
- Layout documentation

### Phase 4: Domain Components (Week 7-8)

**Objective:** implement Priority 3 GhostCart-specific components

**Tasks:**
1. Implement ProductCard component
2. Implement ListingEditor component
3. Implement PriceIndicator component
4. Implement HealthScore component
5. Implement ActivityTimeline component
6. Implement BulkActionBar component
7. Implement MarketplaceBadge component
8. Implement AutomationStatus component

**Deliverables:**
- 8 domain-specific components
- Component usage patterns documented
- Integration with existing pages
- Performance optimization

### Phase 5: Integration & Polish (Week 9-10)

**Objective:** Integrate design system into existing application

**Tasks:**
1. Replace existing stub components with new design system
2. Update all existing pages to use new components
3. Implement theme switching functionality
4. Conduct accessibility audit
5. Performance optimization
6. Cross-browser testing
7. Design system documentation completion

**Deliverables:**
- Full design system integration
- Accessibility compliance verified
- Performance benchmarks met
- Complete design system documentation
- Component registry and usage guidelines

---

## 📊 SUCCESS METRICS

### Quality Metrics

**Accessibility:**
- WCAG 2.1 AA compliance: 100%
- Keyboard navigation coverage: 100%
- Screen reader compatibility: Verified with NVDA/JAWS

**Performance:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- Component bundle size: < 200KB gzipped

**Consistency:**
- Design token usage: 100% (no hardcoded values)
- Component reusability: > 80% of UI uses design system components
- Pattern consistency: All similar patterns use same components

### Adoption Metrics

**Developer Experience:**
- Component documentation coverage: 100%
- Component examples: 100%
- Integration time for new pages: < 2 hours

**User Experience:**
- Task completion rate: > 95%
- User satisfaction: > 4.5/5
- Error rate reduction: > 50% vs stub components

---

## 🎯 NEXT STEPS

### Immediate Actions

1. **Review and Approve** - Stakeholder review of this design proposal
2. **Skills Integration** - Activate shadcn skill for component management
3. **Environment Setup** - Prepare development environment for design system implementation
4. **Team Alignment** - Align development team on design system approach and timeline

### Decision Points

**Requires Stakeholder Input:**
- Brand identity and visual differentiation preferences
- Theme strategy (light/dark mode priority)
- Component priority adjustments
- Timeline and resource allocation

**Technical Decisions:**
- shadcn/ui preset selection (base-nova vs custom)
- Icon library selection (Lucide vs Tabler vs custom)
- Animation library selection (Framer Motion vs CSS-only)
- Documentation platform (Storybook vs custom)

---

## 📝 CONCLUSION

This design system proposal establishes a **Mode A (Enterprise/Professional)** foundation for GhostCart that prioritizes:

1. **Professional Excellence** - Clean, trustworthy, operational design
2. **Accessibility** - WCAG 2.1 AA compliance as a baseline
3. **Consistency** - Design tokens and component reusability
4. **Efficiency** - Developer experience and rapid development
5. **Scalability** - Foundation for future growth and features

The proposed implementation uses **shadcn/ui** as the component foundation, augmented with GhostCart-specific semantic tokens and domain-specific components. This approach balances immediate Stage 2 needs with long-term Stage 3+ scalability.

**Recommendation:** Proceed with Phase 1 (Foundation) implementation upon stakeholder approval.

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-10  
**Next Review:** After Phase 1 completion
