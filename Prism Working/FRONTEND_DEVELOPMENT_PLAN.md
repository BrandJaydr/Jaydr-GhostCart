# Frontend Development Plan - Jaydr GhostCart

> **Author:** PRISM (Design System Agent)
> **Date:** 2026-08-11
> **Status:** DRAFT - Ready for Implementation
> **Context:** Based on Triple Pass Analysis and comprehensive backend API mapping

> **ACTIVE IMPLEMENTATION NOTICE (2026-08-12):** Verified baseline: **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10**. Tailwind v3 is intended but not installed at the root. Follow `UI_RECOVERY_BRIEF.md` for ownership: GhostCart semantic HTML + Tailwind for the shell/navigation; HeroUI v2 only for verified interactive primitives. MagicUI/Lightswind are deferred. This notice overrides older references to HeroUI `AppShell`/`Sidebar` APIs.

---

## Executive Summary

**Finding:** No dedicated frontend development plan exists. The current frontend implementation is minimal (3 pages) compared to extensive backend capabilities (Stages 2-4 complete with 14 database migrations and comprehensive API endpoints).

**Recommendation:** Create a phased frontend development plan that maps existing backend APIs to required UI screens, prioritizing user workflow completion over aspirational features.

**UI Library Strategy:** Adopt HeroUI v2 as primary component library, supplemented by MagicUI for animations and Lightswind UI for advanced 3D/performance components.

**Important Note:** HeroUI v3 requires React 19+, but the project currently uses React 18.3.1. HeroUI v2 supports React 18+ and provides enterprise-grade components with React Aria accessibility. Install with `--legacy-peer-deps` flag to handle peer dependency warnings.

---

## Triple Pass Analysis Results

### Pass 1: Document Scan (Completed)
- **README.md:** Confirms Stages 2-4 backend complete, modular monolith architecture
- **TECHNICAL_WIKI.md:** Explicitly states Frontend UI Component Tree.md is aspirational, not current implementation
- **tasks/todo.md:** Stage 1 frontend scope limited to 4 screens; explicitly defers full component tree
- **Frontend UI Component Tree.md:** ~30 screens, WordPress plugin architecture - aspirational future state

### Pass 2: Deep Read (Completed)
**Current Backend Capabilities (Stages 2-4):**
- Real supplier adapters (CSV, eBay)
- Stock/price refresh system
- Margin calculation system  
- Repricing system with guardrails
- AI-powered listing optimization
- Enhanced RLS policies and audit trails
- 14 database migrations (0001-0014)

**Current Frontend State:**
- 3 pages only: import, products/[id], listings/[id]
- 6 basic UI components: Button, Input, EmptyState, ErrorState, PageHeader, StatusBadge
- No dashboard, product library, pricing management, or settings pages
- Missing layout infrastructure (sidebar, navigation, breadcrumbs)

### Pass 3: Gap Analysis (Completed)
**Critical Gaps:**
1. No dashboard overview for operational metrics
2. No product library for browsing imported products
3. No pricing management UI for repricing rules
4. No job monitoring UI for background tasks
5. No settings pages for configuration
6. Missing layout infrastructure (sidebar, navigation, breadcrumbs)

---

## Backend API Endpoint Mapping

### Products API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/products` | GET | List products with pagination/filtering | Product Library |
| `/api/products` | POST | Initiate product import | Import Form (exists) |
| `/api/products/[id]` | GET | Get single product details | Product Detail |
| `/api/products/[id]/approve` | POST | Approve product for use | Product Review |
| `/api/products/[id]/corrections` | POST | Submit user corrections | Product Correction Form (exists) |
| `/api/products/[id]/refresh` | POST | Trigger stock/price refresh | Product Detail |
| `/api/products/[id]/review-status` | GET | Get review status | Product Review |

### Listings API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/listings` | GET | List listing drafts | Listings Library |
| `/api/listings` | POST | Create listing draft | Listing Draft Editor (exists) |
| `/api/listings/[id]` | GET | Get single listing | Listing Detail |
| `/api/listings/[id]` | PUT | Update listing draft | Listing Draft Editor |
| `/api/listings/calculate-margin` | POST | Calculate listing margin | Listing Draft Editor |

### Dashboard API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/dashboard/metrics` | GET | Get operational metrics | Dashboard Overview |

### Jobs API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/jobs/[id]` | GET | Get job status | Job Detail |
| `/api/jobs/[id]/retry` | POST | Retry failed job | Job Detail |
| `/api/jobs/activity` | GET | Get job activity log | Job Activity Monitor |
| `/api/jobs/kill` | POST | Kill running job | Job Activity Monitor |

### Repricing API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/repricing/suggest` | GET | Get repricing suggestions | Repricing Dashboard |
| `/api/repricing/apply` | POST | Apply repricing changes | Repricing Dashboard |
| `/api/repricing/pause` | POST | Pause global repricing | Repricing Dashboard |

### AI API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/ai/rewrite` | POST | Generate AI listing rewrite | Listing Rewrite Editor |

### eBay API
| Endpoint | Method | Purpose | UI Screen Needed |
|----------|--------|---------|------------------|
| `/api/ebay/submit` | POST | Submit listing to eBay | Export Wizard |
| `/api/ebay/export/csv` | POST | Export as CSV | Export Wizard |

---

## Phased Frontend Development Plan

### Phase 1: Core Layout Infrastructure (Priority: CRITICAL)
**Objective:** Establish navigation and layout foundation for all screens.

**Screens/Components:**
1. **AppShell Component** - Main layout wrapper with semantic HTML CSS Grid sidebar + topbar
2. **Sidebar Component** - Collapsible navigation with sections using **pure CSS hover transformations** (zero re-render overhead)
3. **TopNav Component** - Top navigation bar with search, notifications, profile
4. **FloatingSearchBar Component** - Animated command palette (`Ctrl+K`) centered at 25vh with suggestions, fuzzy command matching, and click-outside dismissal
5. **Breadcrumbs Component** - Navigation trail for deep pages
6. **Dashboard Layout** - Auth-gated layout with session validation
7. **Toast Notifications** - Global toast notification system
8. **Loading States** - Spinner and skeleton components
9. **Error States** - Error display components

**Dependencies:** None (can start immediately)
**Estimated Effort:** 3-5 days
**UI Library:** HeroUI v2 (primary) - Install with `npm install @heroui/react@^2.2.0 --legacy-peer-deps`


### Phase 2: Dashboard Overview (Priority: HIGH)
**Objective:** Provide operational visibility into system metrics.

**Screens:**
1. **Dashboard Overview Page** (`/dashboard`)
   - Import metrics (success/failure rates)
   - Listing states breakdown
   - Job failures overview
   - Margin analysis summary
   - Quick action buttons

**Components:**
- StatCard (KPI cards)
- MetricChart (import trends)
- ActivityFeed (recent events)
- QuickActions (common tasks)

**API Integration:** `/api/dashboard/metrics`
**Dependencies:** Phase 1 (Layout)
**Estimated Effort:** 4-6 days
**UI Library:** HeroUI v2 (primary), Chart library for metrics

### Phase 3: Product Library (Priority: HIGH)
**Objective:** Enable browsing and management of imported products.

**Screens:**
1. **Product Library Page** (`/products`)
   - Paginated product table
   - Filter by supplier, status, availability
   - Search functionality
   - Bulk actions (delete, export, refresh)

2. **Product Detail Page** (`/products/[id]`)
   - Full product information display
   - Source metadata and confidence scores
   - Correction history
   - Action buttons (edit, refresh, create listing)

**Components:**
- DataTable (sortable/filterable)
- TableFilters (filter sidebar)
- ProductCard (grid view alternative)
- ConfidenceIndicator (data quality display)
- **SmartLoading Component** - Stage-based progress display supporting step/continuous states (Idle → Validating → Ingesting → Syncing → Complete/Error)

**API Integration:** `/api/products`, `/api/products/[id]`, `/api/products/[id]/refresh`
**Dependencies:** Phase 1 (Layout)
**Estimated Effort:** 5-7 days
**UI Library:** HeroUI v2 (primary)


### Phase 4: Listings Management (Priority: HIGH)
**Objective:** Complete the listing workflow from draft to submission.

**Screens:**
1. **Listings Library Page** (`/listings`)
   - Paginated listing drafts table
   - Filter by state, marketplace
   - Status indicators
   - Bulk actions

2. **Enhanced Listing Draft Editor** (enhance existing `/listings/[id]/draft`)
   - AI rewrite integration
   - Margin calculator display
   - Category mapping
   - Export wizard integration

**Components:**
- ListingStatusBadge (state machine visualization)
- MarginCalculator (live margin display)
- ExportWizard (multi-step export flow)
- CategoryMapper (marketplace category selection)

**API Integration:** `/api/listings`, `/api/listings/[id]`, `/api/listings/calculate-margin`, `/api/ai/rewrite`, `/api/ebay/submit`, `/api/ebay/export/csv`
**Dependencies:** Phase 1 (Layout), Phase 3 (Products)
**Estimated Effort:** 6-8 days
**UI Library:** HeroUI v2 (primary), MagicUI (AI animations)

### Phase 5: Job Monitoring (Priority: MEDIUM)
**Objective:** Provide visibility into background job execution on Layer 3 workers.

**Screens:**
1. **Job Activity Monitor** (`/jobs`)
   - Recent jobs table mapping BullMQ queue states (idle, active, complete, failed, retrying)
   - Filter by type, status
   - Error details display
   - Retry/kill controls

2. **Job Detail Page** (`/jobs/[id]`)
   - Full job information reflecting Redis/BullMQ worker outputs
   - Error stack traces
   - Retry history
   - Manual retry button

**Components:**
- JobStatusBadge (job state visualization)
- ErrorDisplay (formatted error messages)
- RetryButton (manual retry control triggering Layer 3 BullMQ re-evaluation)
- KillButton (emergency queue job removal)

**API Integration:** `/api/jobs/activity`, `/api/jobs/[id]`, `/api/jobs/[id]/retry`, `/api/jobs/kill`
**Dependencies:** Phase 1 (Layout)
**Estimated Effort:** 4-5 days
**UI Library:** HeroUI v2 (primary)


### Phase 6: Pricing Management (Priority: MEDIUM)
**Objective:** Enable repricing rule configuration and monitoring.

**Screens:**
1. **Repricing Dashboard** (`/pricing`)
   - Price change alerts
   - Repricing suggestions
   - Global pause control
   - Margin analysis

2. **Repricing Rules Page** (`/pricing/rules`)
   - Rule list with conditions
   - Create/edit rule forms
   - Rule testing interface

**Components:**
- PriceChangeAlert (notification card)
- RepricingRuleCard (rule display)
- RuleConditionBuilder (if/then rule builder)
- MarginAnalysisChart (margin distribution)

**API Integration:** `/api/repricing/suggest`, `/api/repricing/apply`, `/api/repricing/pause`
**Dependencies:** Phase 1 (Layout), Phase 3 (Products)
**Estimated Effort:** 5-7 days
**UI Library:** HeroUI v2 (primary), Chart library for analysis

### Phase 7: Settings & Configuration (Priority: LOW)
**Objective:** Provide system configuration interface.

**Screens:**
1. **Settings Overview** (`/settings`)
   - Navigation to settings sections
   - Current configuration summary

2. **General Settings** (`/settings/general`)
   - Store name, timezone, currency
   - Default pricing configuration

3. **Marketplace Connections** (`/settings/marketplaces`)
   - Connected marketplaces displaying connection states
   - OAuth flows integrated via the **Valet Key Pattern** (raw credentials and tokens vaulted; client uses only connection identifiers)

4. **Supplier Management** (`/settings/suppliers`)
   - Supplier list
   - Add/edit supplier forms

**Components:**
- SettingsNav (settings navigation)
- MarketplaceConnectionCard (connection status using opaque handles)
- SupplierForm (supplier configuration)
- DefaultPricingForm (pricing defaults)


**Dependencies:** Phase 1 (Layout)
**Estimated Effort:** 6-8 days
**UI Library:** HeroUI v2 (primary)

---

## Design System Strategy

### UI Library Selection

**HeroUI v2 (Primary Component Library)**
- **Strengths:** Production-ready, React Aria accessibility, Tailwind CSS v4, compound components, AI-native with MCP server
- **Best For:** Core UI components, forms, data tables, navigation
- **Integration:** Zero boilerplate, no Provider wrapper needed, tree-shakeable packages
- **React 18 Compatibility:** HeroUI v2 supports React 18+ (project uses React 18.3.1)
- **Installation:** `npm install @heroui/react@^2.2.0 --legacy-peer-deps`
- **Usage:** 80% of all components

**MagicUI (Animation Focus)**
- **Strengths:** 150+ animated components, copy-paste approach, perfect companion to HeroUI
- **Best For:** Animations, visual effects, landing page elements
- **Integration:** Same installation approach as HeroUI
- **Usage:** 15% of components (animations only)

**Lightswind UI (Advanced/3D Focus)**
- **Strengths:** 169+ components, 3D elements, WebGL, MCP integration, strict TypeScript
- **Best For:** Advanced visual effects, 3D components, high-performance layouts
- **Integration:** CLI setup, universal dark mode, 100/100 Core Web Vitals
- **Usage:** 5% of components (specialized features only)

### Design Tokens to Define
1. **Color System:** Primary, secondary, semantic colors (success, warning, error)
2. **Typography:** Font families, sizes, weights, line heights
3. **Spacing:** 8px grid system with scale
4. **Border Radius:** Consistent radius scale
5. **Shadows:** Elevation system for depth
6. **Transitions:** Standard animation durations

### Component Development Rules
1. **Use existing stubs as foundation** - enhance Button, Input, etc. rather than replacing
2. **Follow HeroUI patterns** - compound components API (`Card.Header`, `Card.Content`)
3. **Accessibility first** - all components must be keyboard navigable and screen reader friendly
4. **Responsive design** - mobile-first approach with breakpoints
5. **Loading states** - all async operations must show loading indicators
6. **Error boundaries** - wrap sections with error boundaries for graceful failure

---

## Implementation Guidelines

### Page Development Rules
1. **Server-side rendering** where possible for performance
2. **Client-side data fetching** with React Query or SWR for real-time updates
3. **Optimistic UI** for immediate feedback on user actions
4. **Form validation** with Zod schemas (already in use)
5. **Idempotency handling** for duplicate request prevention
6. **Tenant isolation** - all data requests must include tenant context

### Testing Strategy
1. **Component unit tests** with Vitest and React Testing Library
2. **Page integration tests** with Playwright E2E
3. **Accessibility audits** with axe-core
4. **Performance monitoring** with Lighthouse CI
5. **Visual regression testing** for design consistency

---

## Success Metrics

### Phase Completion Criteria
- **Phase 1:** Layout components render correctly, navigation works
- **Phase 2:** Dashboard displays real metrics from API
- **Phase 3:** Product library shows paginated products, filters work
- **Phase 4:** Complete workflow from import to export functional
- **Phase 5:** Job monitoring shows real-time job status
- **Phase 6:** Repricing suggestions display and apply correctly
- **Phase 7:** Settings pages save and load configuration

### Quality Gates
- All components pass accessibility audit (WCAG 2.1 AA)
- All pages load within 2 seconds on 3G connection
- All forms have client-side validation
- All async operations have loading states
- All errors have user-friendly messages
- All critical user flows have E2E tests

---

## Dependencies & Handoffs

### Required Agent Coordination
- **@agent:forge** - Implement page components and routing
- **@agent:archivist** - Ensure database queries support UI requirements
- **@agent:atlas** - Verify API contracts match UI needs
- **@agent:scribe** - Document component usage patterns

### External Dependencies
- HeroUI v2 components (@heroui/react@^2.2.0)
- MagicUI components (copy-paste approach)
- Lightswind UI components (CLI installation)
- React Query or SWR for data fetching
- Recharts or Chart.js for data visualization
- Framer Motion for animations (included with MagicUI)

---

## Risk Assessment

### Technical Risks
1. **Design system decision delay** - Could block component development
   - **Mitigation:** HeroUI v2 decision already made, proceed with implementation with React 18 compatibility
2. **HeroUI v2 peer dependency warnings** - May require --legacy-peer-deps flag
   - **Mitigation:** Document installation process with --legacy-peer-deps flag; warnings are non-blocking
3. **API contract mismatches** - UI requirements may exceed current API capabilities
   - **Mitigation:** Coordinate with @agent:atlas during Phase 1
4. **Performance issues** - Complex dashboards may impact load times
   - **Mitigation:** Implement pagination, lazy loading, caching

### Project Risks
1. **Scope creep** - Aspirational features from Frontend UI Component Tree.md
   - **Mitigation:** Strict adherence to phased plan, defer non-essential features

2. **Resource allocation** - Frontend development competes with backend work
   - **Mitigation:** Clear prioritization, focus on user-critical paths

---

## Next Steps

1. **Begin Phase 1** - Layout infrastructure development in UI sandbox
2. **Install HeroUI** - Primary component library setup
3. **Create design tokens** - Establish consistent design system
4. **Build AppShell** - Foundation layout component
5. **Implement navigation** - Sidebar and top navigation
6. **Add loading states** - Spinner and skeleton components
7. **Set up toast system** - Global notification system

---

## Appendix: Aspirational vs. Current Feature Mapping

| Aspirational Feature (Frontend UI Component Tree.md) | Current Backend Support | Recommended Phase |
|-----------------------------------------------------|------------------------|-------------------|
| Dashboard Overview | ✅ API exists | Phase 2 |
| Product Library | ✅ API exists | Phase 3 |
| Listings Management | ✅ API exists | Phase 4 |
| Product Review | ✅ API exists | Phase 3 |
| Listing Rewrite | ✅ API exists | Phase 4 |
| Export Wizard | ✅ API exists | Phase 4 |
| Pricing/Repricing | ✅ API exists | Phase 6 |
| Job Monitoring | ✅ API exists | Phase 5 |
| Orders Management | ❌ No API yet | Deferred |
| Analytics Dashboard | ⚠️ Partial API | Deferred |
| Health Monitoring | ❌ No API yet | Deferred |
| Settings/Configuration | ⚠️ Partial API | Phase 7 |
| Team Management | ❌ No API yet | Deferred |
| Profile/Security | ⚠️ Partial API | Deferred |

**Note:** Only features with backend API support are included in current phases. Deferred features align with Stage 5+ roadmap in tasks/todo.md.

---

*End of Frontend Development Plan*
