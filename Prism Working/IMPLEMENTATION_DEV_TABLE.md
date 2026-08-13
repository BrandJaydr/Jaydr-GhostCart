# Implementation Development Table

> **Author:** PRISM (Design System Agent)
> **Date:** 2026-08-11
> **Purpose:** Comprehensive feature implementation tracking with UI components, loading strategies, and dependencies

> **ACTIVE IMPLEMENTATION NOTICE (2026-08-12):** **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10** are verified. Tailwind v3 is intended but its root dependency is missing. Use `UI_RECOVERY_BRIEF.md`; HeroUI v2 does not provide `AppShell` or `Sidebar` components.

---

## Phase 1: Core Layout Infrastructure (CRITICAL)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| AppShell Layout | GhostCart semantic HTML + Tailwind grid/flex shell | Server component | None | Phase 1 (CRITICAL) | Tokens + global CSS | TypeScript/React |
| Sidebar Navigation | GhostCart `Sidebar` + HeroUI v2 verified primitives where needed | Client behavior within server layout | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Top Navigation Bar | HeroUI v2 Navbar, Avatar, Dropdown | Server component | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Breadcrumbs | HeroUI v2 Breadcrumbs | Server component | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Dashboard Layout | Auth-gated layout wrapper | Server component | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Toast Notifications | GhostCart-owned provider using the verified HeroUI v2 API or accessible custom live region | Global state | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Loading States | HeroUI v2 Spinner, Skeleton | Per-component | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |
| Error States | ErrorDisplay, Button | Per-component | None | Phase 1 (CRITICAL) | AppShell | TypeScript/React |

---

## Phase 2: Dashboard Overview (HIGH)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Dashboard Overview Page | StatCard, MetricChart, ActivityFeed | React Query caching | `/api/dashboard/metrics` | Phase 2 (HIGH) | AppShell | TypeScript/React |
| Import Metrics Widget | StatCard, Progress | React Query (5s refresh) | `/api/dashboard/metrics` | Phase 2 (HIGH) | Dashboard Overview | TypeScript/React |
| Listing States Widget | Badge, ProgressBar | React Query (5s refresh) | `/api/dashboard/metrics` | Phase 2 (HIGH) | Dashboard Overview | TypeScript/React |
| Job Failures Widget | Alert, ErrorDisplay | React Query (5s refresh) | `/api/dashboard/metrics` | Phase 2 (HIGH) | Dashboard Overview | TypeScript/React |
| Margin Analysis Widget | StatCard, Chart | React Query (5s refresh) | `/api/dashboard/metrics` | Phase 2 (HIGH) | Dashboard Overview | TypeScript/React |
| Quick Actions Panel | Button, Card | Static | None | Phase 2 (HIGH) | Dashboard Overview | TypeScript/React |

---

## Phase 3: Product Library (HIGH)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Product Library Page | DataTable, TableFilters, ProductCard | Infinite scroll | `/api/products` | Phase 3 (HIGH) | AppShell | TypeScript/React |
| Product Table | HeroUI v2 Table, Pagination | Server-side pagination | `/api/products` | Phase 3 (HIGH) | Product Library | TypeScript/React |
| Filter Sidebar | Input, Select, Checkbox | Client-side state | None | Phase 3 (HIGH) | Product Library | TypeScript/React |
| Search Functionality | HeroUI v2 Input, SearchIcon | Debounced search | `/api/products` | Phase 3 (HIGH) | Product Library | TypeScript/React |
| Bulk Actions Bar | Button, Checkbox | Optimistic UI | `/api/products` | Phase 3 (HIGH) | Product Library | TypeScript/React |
| Product Detail Page | Card, ConfidenceIndicator, Button | Optimistic UI | `/api/products/[id]` | Phase 3 (HIGH) | Product Library | TypeScript/React |
| Source Metadata Display | Card, Badge, Text | Static | `/api/products/[id]` | Phase 3 (HIGH) | Product Detail | TypeScript/React |
| Confidence Score Display | ProgressBar, Badge | Static | `/api/products/[id]` | Phase 3 (HIGH) | Product Detail | TypeScript/React |
| Correction History | DataTable, Timeline | Static | `/api/products/[id]/corrections` | Phase 3 (HIGH) | Product Detail | TypeScript/React |
| Refresh Button | HeroUI v2 Button (isLoading) | Optimistic UI | `/api/products/[id]/refresh` | Phase 3 (HIGH) | Product Detail | TypeScript/React |
| Create Listing Button | HeroUI v2 Button | Navigation | None | Phase 3 (HIGH) | Product Detail | TypeScript/React |

---

## Phase 4: Listings Management (HIGH)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Listings Library Page | DataTable, ListingStatusBadge | Server-side pagination | `/api/listings` | Phase 4 (HIGH) | Product Library | TypeScript/React |
| Listing Table | HeroUI v2 Table, Filter | Server-side pagination | `/api/listings` | Phase 4 (HIGH) | Listings Library | TypeScript/React |
| State Filter | HeroUI v2 Select, Badge | Client-side state | `/api/listings` | Phase 4 (HIGH) | Listings Library | TypeScript/React |
| Marketplace Filter | HeroUI v2 Select, Avatar | Client-side state | `/api/listings` | Phase 4 (HIGH) | Listings Library | TypeScript/React |
| Enhanced Listing Draft Editor | Form, Input, MarginCalculator | Optimistic UI | `/api/listings/[id]` | Phase 4 (HIGH) | Listings Library | TypeScript/React |
| Title Editor | HeroUI v2 Input, AITooltip | Optimistic UI | `/api/listings/[id]` | Phase 4 (HIGH) | Listing Editor | TypeScript/React |
| Description Editor | HeroUI v2 Textarea, AIButton | Optimistic UI | `/api/listings/[id]` | Phase 4 (HIGH) | Listing Editor | TypeScript/React |
| AI Rewrite Integration | MagicUI Animated Button, Dialog | Async with loading | `/api/ai/rewrite` | Phase 4 (HIGH) | Listing Editor | TypeScript/React |
| Margin Calculator Display | StatCard, Progress | Real-time calculation | `/api/listings/calculate-margin` | Phase 4 (HIGH) | Listing Editor | TypeScript/React |
| Category Mapper | HeroUI v2 Select, Tree | Optimistic UI | None | Phase 4 (HIGH) | Listing Editor | TypeScript/React |
| Export Wizard | Stepper, Wizard, Button | Step-by-step loading | `/api/ebay/submit` | Phase 4 (HIGH) | Export Wizard | TypeScript/React |
| Export Target Select | HeroUI v2 Checkbox, Avatar | Static | None | Phase 4 (HIGH) | Export Wizard | TypeScript/React |
| Export Progress | ProgressBar, StatusBadge | Polling (2s) | `/api/jobs/[id]` | Phase 4 (HIGH) | Export Wizard | TypeScript/React |
| CSV Export | HeroUI v2 Button | File download | `/api/ebay/export/csv` | Phase 4 (HIGH) | Export Wizard | TypeScript/React |

---

## Phase 5: Job Monitoring (MEDIUM)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Job Activity Monitor | DataTable, JobStatusBadge | Polling (5s) | `/api/jobs/activity` | Phase 5 (MEDIUM) | AppShell | TypeScript/React |
| Job Table | HeroUI Table, Filter | Server-side pagination | `/api/jobs/activity` | Phase 5 (MEDIUM) | Job Monitor | TypeScript/React |
| Job Type Filter | HeroUI Select, Badge | Client-side state | `/api/jobs/activity` | Phase 5 (MEDIUM) | Job Monitor | TypeScript/React |
| Job Status Filter | HeroUI Select, StatusBadge | Client-side state | `/api/jobs/activity` | Phase 5 (MEDIUM) | Job Monitor | TypeScript/React |
| Job Detail Page | ErrorDisplay, RetryButton, KillButton | Static load | `/api/jobs/[id]` | Phase 5 (MEDIUM) | Job Monitor | TypeScript/React |
| Error Stack Trace | Code Block, CopyButton | Static | `/api/jobs/[id]` | Phase 5 (MEDIUM) | Job Detail | TypeScript/React |
| Retry History | DataTable, Timeline | Static | `/api/jobs/[id]` | Phase 5 (MEDIUM) | Job Detail | TypeScript/React |
| Manual Retry Button | HeroUI Button (isLoading) | Optimistic UI | `/api/jobs/[id]/retry` | Phase 5 (MEDIUM) | Job Detail | TypeScript/React |
| Kill Button | HeroUI Button (danger) | Optimistic UI | `/api/jobs/kill` | Phase 5 (MEDIUM) | Job Detail | TypeScript/React |

---

## Phase 6: Pricing Management (MEDIUM)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Repricing Dashboard | PriceChangeAlert, MarginChart | React Query | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Product Library | TypeScript/React |
| Price Change Alerts | HeroUI Alert, Badge | Real-time updates | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Repricing Dashboard | TypeScript/React |
| Margin Analysis Chart | Chart, StatCard | React Query | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Repricing Dashboard | TypeScript/React |
| Global Pause Control | HeroUI Toggle, Button | Optimistic UI | `/api/repricing/pause` | Phase 6 (MEDIUM) | Repricing Dashboard | TypeScript/React |
| Repricing Rules Page | RepricingRuleCard, DataTable | Server-side pagination | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Repricing Dashboard | TypeScript/React |
| Rule List | HeroUI Table, Filter | Server-side pagination | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Repricing Rules | TypeScript/React |
| Rule Condition Builder | RuleConditionBuilder, Form | Optimistic UI | `/api/repricing/apply` | Phase 6 (MEDIUM) | Repricing Rules | TypeScript/React |
| Create Rule Form | HeroUI Form, Input, Select | Optimistic UI | `/api/repricing/apply` | Phase 6 (MEDIUM) | Repricing Rules | TypeScript/React |
| Edit Rule Form | HeroUI Form, Input, Select | Optimistic UI | `/api/repricing/apply` | Phase 6 (MEDIUM) | Repricing Rules | TypeScript/React |
| Rule Testing Interface | Button, Preview | Async with loading | `/api/repricing/suggest` | Phase 6 (MEDIUM) | Repricing Rules | TypeScript/React |

---

## Phase 7: Settings & Configuration (LOW)

| Feature Name | Required UI Components | Loading Strategy | API Endpoints | Priority/Phase | Dependencies | Coding Language |
|--------------|----------------------|------------------|---------------|---------------|--------------|-----------------|
| Settings Overview | SettingsNav, Card | Server component | None | Phase 7 (LOW) | AppShell | TypeScript/React |
| Settings Navigation | HeroUI Tabs, Breadcrumbs | Client-side state | None | Phase 7 (LOW) | Settings Overview | TypeScript/React |
| General Settings | HeroUI Form, Input, Select | Optimistic UI | Settings API | Phase 7 (LOW) | Settings Overview | TypeScript/React |
| Store Name Input | HeroUI Input | Optimistic UI | Settings API | Phase 7 (LOW) | General Settings | TypeScript/React |
| Timezone Select | HeroUI Select | Optimistic UI | Settings API | Phase 7 (LOW) | General Settings | TypeScript/React |
| Currency Select | HeroUI Select | Optimistic UI | Settings API | Phase 7 (LOW) | General Settings | TypeScript/React |
| Marketplace Connections | MarketplaceConnectionCard, Button | OAuth flow | `/api/settings/marketplaces` | Phase 7 (LOW) | Settings Overview | TypeScript/React |
| Connection Status Display | HeroUI Badge, Card | Static | `/api/settings/marketplaces` | Phase 7 (LOW) | Marketplace Connections | TypeScript/React |
| OAuth Flow Handler | HeroUI Button, Dialog | Async with loading | `/api/settings/marketplaces` | Phase 7 (LOW) | Marketplace Connections | TypeScript/React |
| Supplier Management | SupplierForm, DataTable | Optimistic UI | `/api/settings/suppliers` | Phase 7 (LOW) | Settings Overview | TypeScript/React |
| Supplier List | HeroUI Table, Filter | Server-side pagination | `/api/settings/suppliers` | Phase 7 (LOW) | Supplier Management | TypeScript/React |
| Add Supplier Form | HeroUI Form, Input, Select | Optimistic UI | `/api/settings/suppliers` | Phase 7 (LOW) | Supplier Management | TypeScript/React |
| Edit Supplier Form | HeroUI Form, Input, Select | Optimistic UI | `/api/settings/suppliers` | Phase 7 (LOW) | Supplier Management | TypeScript/React |
| Default Pricing Form | HeroUI Form, Input, Number | Optimistic UI | Settings API | Phase 7 (LOW) | Settings Overview | TypeScript/React |
| Markup Percentage Input | HeroUI Input (number) | Optimistic UI | Settings API | Phase 7 (LOW) | Default Pricing | TypeScript/React |
| Fee Configuration | HeroUI Input, Select | Optimistic UI | Settings API | Phase 7 (LOW) | Default Pricing | TypeScript/React |

---

## Component Library Assignment Summary

### HeroUI Components (Primary)
- **Layout:** AppShell, Sidebar, Navbar, Breadcrumbs
- **Navigation:** Tabs, Dropdown Menu, Pagination, Stepper
- **Buttons:** Button, IconButton, Loading Button
- **Forms:** Input, Select, Checkbox, Radio, Textarea, Form
- **Data Display:** Table, Card, Badge, List, Grid, Avatar, Progress
- **Feedback:** Spinner, Skeleton, Alert, Toast, Progress Bar
- **Overlays:** Modal, Dialog, Popover, Tooltip
- **Typography:** Text, Code, Link

### MagicUI Components (Secondary)
- **Animations:** Animated List, Marquee
- **Visual Effects:** Backgrounds, Device Mocks
- **Interactive Elements:** Hero Video Dialog, Terminal Emulator

### Lightswind UI Components (Tertiary)
- **3D Elements:** 3D Carousel, Perspective Cards, 3D Image Slider
- **Advanced Layouts:** Resizable, Scroll Area, Accordion
- **Performance Components:** Optimized Cards, High-performance Tables

---

## Loading Strategy Patterns

### Server Components
- **Use for:** Static content, initial page loads, SEO-critical content
- **Examples:** AppShell, Dashboard Layout, Settings Overview
- **Benefits:** Faster initial load, better SEO, reduced client bundle

### React Query Caching
- **Use for:** Data that changes infrequently, dashboard metrics
- **Examples:** Dashboard metrics, product lists, listing states
- **Benefits:** Automatic caching, background refetching, optimistic updates

### Infinite Scroll
- **Use for:** Large datasets, product libraries, job history
- **Examples:** Product Library, Job Activity Monitor
- **Benefits:** Better UX for large datasets, progressive loading

### Server-Side Pagination
- **Use for:** Structured data, tables, admin interfaces
- **Examples:** Product Table, Listing Table, Job Table
- **Benefits:** Predictable performance, easier navigation, URL state

### Optimistic UI
- **Use for:** User actions, form submissions, state changes
- **Examples:** Product refresh, listing updates, settings changes
- **Benefits:** Instant feedback, better perceived performance

### Polling
- **Use for:** Real-time data, job status, live metrics
- **Examples:** Job monitoring, dashboard metrics, price changes
- **Benefits:** Near real-time updates, simple implementation

### Step-by-Step Loading
- **Use for:** Multi-step processes, wizards, complex flows
- **Examples:** Export Wizard, Onboarding, Configuration
- **Benefits:** Clear progress, better UX for complex tasks

---

## API Integration Mapping

### Products API
- `GET /api/products` - Product Library, Product Table
- `POST /api/products` - Import Form
- `GET /api/products/[id]` - Product Detail
- `POST /api/products/[id]/approve` - Product Review
- `POST /api/products/[id]/corrections` - Product Correction Form
- `POST /api/products/[id]/refresh` - Product Detail Refresh
- `GET /api/products/[id]/review-status` - Product Review Status

### Listings API
- `GET /api/listings` - Listings Library, Listing Table
- `POST /api/listings` - Create Listing Draft
- `GET /api/listings/[id]` - Listing Detail
- `PUT /api/listings/[id]` - Update Listing Draft
- `POST /api/listings/calculate-margin` - Margin Calculator

### Dashboard API
- `GET /api/dashboard/metrics` - Dashboard Overview, All Widgets

### Jobs API
- `GET /api/jobs/activity` - Job Activity Monitor, Job Table
- `GET /api/jobs/[id]` - Job Detail
- `POST /api/jobs/[id]/retry` - Job Detail Retry
- `POST /api/jobs/kill` - Job Detail Kill

### Repricing API
- `GET /api/repricing/suggest` - Repricing Dashboard, Rule Testing
- `POST /api/repricing/apply` - Repricing Rules
- `POST /api/repricing/pause` - Global Pause Control

### AI API
- `POST /api/ai/rewrite` - Listing Rewrite Editor

### eBay API
- `POST /api/ebay/submit` - Export Wizard
- `POST /api/ebay/export/csv` - CSV Export

---

## Dependency Graph

### Phase 1 (Foundation)
- AppShell → All subsequent features
- Toast Notifications → All features with user feedback
- Loading/Error States → All async features

### Phase 2 (Dashboard)
- Dashboard Overview → Depends on AppShell
- All Widgets → Depend on Dashboard Overview

### Phase 3 (Products)
- Product Library → Depends on AppShell
- Product Detail → Depends on Product Library
- All Product Features → Depend on Product Detail

### Phase 4 (Listings)
- Listings Library → Depends on Product Library
- Listing Editor → Depends on Listings Library
- Export Wizard → Depends on Listing Editor

### Phase 5 (Jobs)
- Job Monitor → Depends on AppShell
- Job Detail → Depends on Job Monitor

### Phase 6 (Pricing)
- Repricing Dashboard → Depends on Product Library
- Repricing Rules → Depends on Repricing Dashboard

### Phase 7 (Settings)
- Settings Overview → Depends on AppShell
- All Settings Pages → Depend on Settings Overview

---

## Implementation Priority Matrix

### Critical Path (Must Complete First)
1. AppShell Layout
2. Toast Notifications
3. Loading/Error States
4. Dashboard Overview
5. Product Library
6. Listings Management

### High Priority (Complete After Critical)
1. Product Detail
2. Listing Editor
3. Export Wizard
4. Job Monitoring

### Medium Priority (Complete When Time Permits)
1. Repricing Dashboard
2. Repricing Rules
3. Settings Overview

### Low Priority (Complete Last)
1. General Settings
2. Marketplace Connections
3. Supplier Management

---

*End of Implementation Development Table*
