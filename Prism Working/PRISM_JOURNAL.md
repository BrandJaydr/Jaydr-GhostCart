# PRISM Design System Journal
## Jaydr GhostCart Project

**Agent:** Prism 🎨 - Design System & UI Architecture  
**Project:** Jaydr GhostCart - Enterprise Reseller & Dropshipping Automation Platform  
**Date:** 2026-08-10  
**Status:** Initial Investigation Phase

> **ACTIVE IMPLEMENTATION NOTICE (2026-08-12):** Verified stack: **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10**. Tailwind v3 is intended by `tailwind.config.ts`, but its root dependency is missing. `UI_RECOVERY_BRIEF.md` and `DASHBOARD_STRATEGY_DECISION_MATRIX.md` supersede conflicting library/layout guidance in this journal. HeroUI supplies verified primitives; GhostCart owns semantic/Tailwind layout and navigation.

---

## 🎯 PROJECT VISION SYNTHESIS

### Core Product Identity
GhostCart is an **enterprise-grade automation platform** for resellers and dropshippers that bridges supplier catalog management with major online marketplaces (eBay, Amazon, Facebook Marketplace, Etsy, Shopify).

**Key Value Proposition:**
- Multi-tenant catalog management
- AI-assisted listing generation/optimization  
- Real-time repricing guardrails
- Audit logging and compliance
- Multi-marketplace listing workflows

### Design Mode Determination
**MODE A: ENTERPRISE / PROFESSIONAL** ✅

**Rationale:**
- Target users: Enterprise applications, business software, SaaS platforms, dashboards, data-heavy applications
- Design objectives: Professional, trustworthy, calm, structured, predictable, accessible, information-dense without overwhelming
- This is a B2B SaaS platform for serious business operations, not a consumer marketing experience

**Preferred Component Hierarchy (Mode A):**
1. React Spectrum
2. React Aria / React Aria Components
3. shadcn/ui
4. Existing project components
5. Vetted custom component
6. Newly researched custom component

---

## 📋 CURRENT IMPLEMENTATION STATUS (Stage 2)

### Architecture Reality vs. Vision
**CRITICAL DISTINCTION:** The documentation contains significant aspirational content that is NOT yet implemented:

**Aspirational (Future State - Stage 3+):**
- WordPress admin plugin with ~30 screens
- Microservices architecture (Kafka, API Gateway, etc.)
- Full CRM capabilities
- Mobile applications
- Self-hosting options

**Actual Current Implementation (Stage 2):**
- Single Next.js app (TypeScript) with PostgreSQL + BullMQ
- Modular monolith delivery model
- 4 core screens: sign-in, import form, product review, listing draft
- Real supplier adapter implementations (CSV, eBay)
- Stock/price refresh system with change detection
- 11 database migrations (0001-0011)
- AI-powered listing analysis and optimization

### Current UI Component Tree
The project has a comprehensive **Frontend UI Component Tree.md** that describes a full WordPress plugin interface with:
- Navigation architecture (sidebar + topbar)
- 30+ planned screens across 8 major sections
- Detailed component hierarchy
- Modal/dialog tree
- Button inventory mapping

**However:** This is aspirational. The actual current implementation has only basic stub components in `src/components/ui/`:
- Button.tsx
- Input.tsx  
- EmptyState.tsx
- ErrorState.tsx
- PageHeader.tsx
- StatusBadge.tsx

All are Stage 1 stubs with TODOs for design tokens/styles.

---

## 🎨 DESIGN SYSTEM REQUIREMENTS ANALYSIS

### Current Design State
**Status:** Early Stage 2 - Foundation scaffolded, minimal styling implemented

**Existing:**
- Next.js 14.2 with App Router
- TypeScript configuration
- ESLint + Prettier formatting
- Basic component stubs
- Tailwind CSS (mentioned in docs but implementation status unclear)

**Missing:**
- Design token system (colors, typography, spacing, radius, shadows, motion)
- Component library selection and integration
- Accessibility implementation
- Theme system (light/dark mode)
- Responsive design patterns
- Design documentation

### Design Philosophy from Production Blueprint
The Production Blueprint provides clear design guidance:

**Design Rules:**
- Design for dense, operational work: clear status, timestamps, source attribution, filtering, recoverable errors
- Make automation visible: show why a suggestion exists, what will change, when it ran
- Make irreversible actions explicit: confirmation, preview, role check, audit record
- Meet accessible interaction basics: keyboard navigation, focus states, contrast, labels, responsive behavior
- Treat empty, loading, degraded, and failed states as first-class screens

**UI Build Strategy:**
- Stage 0: Low-fidelity wireframes and user testing
- Stage 1: Minimal functional interface driven by fixtures and API contracts  
- Stages 2-3: Production-quality screens only for workflows backed by real data
- Stage 4+: Expand dashboard, analytics, secondary navigation after users need them

**Key Insight:** "The UI matters immediately for usability and workflow validation; visual polish matters after interaction and data contracts are proven."

---

## 🔍 COMPONENT LIBRARY EVALUATION NEEDS

### Recommended Approach (from Production Blueprint)
- Time-box the decision during Stage 0 or early Stage 1
- Select accessible, actively maintained primitive/component foundation
- Must support: forms, dialogs, tables, menus, toast messages, focus management, dark/light tokens, testability
- Adopt component primitive library rather than inventing accessibility behavior
- Maintain GhostCart-owned semantic tokens
- Build small internal component layer

### Evaluation Scorecard Criteria
- Accessibility
- Keyboard support
- React/TypeScript fit
- Theming capabilities
- Maintenance activity
- Bundle impact
- Licensing
- Team familiarity

### Current Status
**DECISION MADE (2026-08-12):** HeroUI v2 selected as primary component library.

**Rationale for HeroUI v2 Selection:**
1. **React 18 Compatibility:** HeroUI v2 supports React 18+ (project uses React 18.3.1), avoiding React 19 upgrade requirement
2. **Enterprise-Grade:** Production-ready with React Aria accessibility foundation
3. **Project Alignment:** Matches FRONTEND_DEVELOPMENT_PLAN.md specification for HeroUI as primary library
4. **AI-Native:** Built-in MCP server integration for AI-assisted development
5. **Zero Boilerplate:** No Provider wrapper needed, tree-shakeable packages
6. **User Preference:** Aligns with explicit user preference for enterprise-grade libraries

**Why Not shadcn/ui (DESIGN_PROPOSAL.md Recommendation):**
- shadcn/ui was initially recommended in DESIGN_PROPOSAL.md
- However, FRONTEND_DEVELOPMENT_PLAN.md explicitly specifies HeroUI as primary library
- User expressed strong preference for enterprise-grade libraries (HeroUI, MagicUI, Lightswind UI)
- HeroUI v2 provides similar enterprise benefits with better project alignment

**Installation:** `npm install @heroui/react@^2.2.0 --legacy-peer-deps`

**Note:** HeroUI v3 requires React 19+, but project uses React 18.3.1. Using v2 for compatibility.

---

## 📊 UI/UX VISION FROM DOCUMENTATION

### User Experience Goals
**From Project Concept.txt:**
- "One dashboard to run every marketplace, supplier, listing, order, and profit stream"
- Total supplier freedom
- Total marketplace freedom  
- Faster automation
- Smarter AI
- Better control than every competitor

### Key User Workflows
1. **Product Research Engine** - Search, filter, margin calculation, competitor analysis
2. **AI Listing Generator** - Auto-create titles, descriptions, SEO keywords, multiple versions for A/B testing
3. **Multi-Marketplace Publishing** - Publish to one or all marketplaces, sync inventory
4. **Auto-Repricing + Inventory Sync** - Real-time monitoring, automatic price updates
5. **Auto-Ordering and Fulfillment** - Automatic purchasing, tracking number updates
6. **Store Health & Safety Center** - Risk dashboard, warning notifications, account health
7. **Multi-User Team Mode** - Permissions, activity logs, task board
8. **Analytics Dashboard** - Profit tracking, performance metrics, heatmaps

### Design Personality
**Professional Enterprise Dashboard:**
- Information-dense but not overwhelming
- Clear hierarchy and status indicators
- Automation transparency (show what's happening and why)
- Strong error recovery and audit trails
- Multi-tenant isolation visible in UI
- Operational efficiency focus

---

## 🚨 CRITICAL DESIGN CONSIDERATIONS

### Multi-Tenancy in UI
- Every screen must be tenant-aware
- Clear visual indication of which store/account context is active
- Tenant switching capabilities
- Role-based UI variations (Owner vs VA vs Accountant)

### Automation Visibility
- Show job status, progress, and results
- Display why automated actions occurred
- Provide manual override capabilities
- Audit trail display for compliance

### Error Recovery
- Clear error states with actionable next steps
- Retry mechanisms with visibility
- Degraded mode operation
- Failed job inspection and resolution

### Data Density
- Professional users need information density
- Tables with sorting, filtering, pagination
- Status badges, timestamps, source attribution
- Efficient workflows for bulk operations

---

## 📁 NEXT STEPS FOR PRISM

### Immediate Tasks
1. **Survey Agent Skills Folder** - Catalog available design-related skills
2. **Analyze Current Codebase** - Review existing component implementations
3. **Design System Selection** - Evaluate React Spectrum, React Aria, shadcn/ui against project needs
4. **Token System Design** - Define color, typography, spacing, motion tokens
5. **Component Audit** - Inventory existing stub components and identify gaps
6. **Accessibility Baseline** - Establish WCAG compliance requirements

### Design System Foundation
- Select and integrate component library
- Implement design token system
- Create core component layer (Button, Input, Select, Dialog, DataTable, StatusBadge, EmptyState, ErrorState, PageHeader)
- Establish theme system (light/dark mode)
- Document component usage patterns

### Stage 2 UI Enhancements
- Polish the 4 core screens with production-quality components
- Implement proper loading, error, and empty states
- Add keyboard navigation and focus management
- Ensure responsive behavior
- Add accessibility attributes and ARIA labels

---

## 📝 NOTES & OBSERVATIONS

### Documentation Gaps
- No current design system documentation exists
- Component tree is aspirational, not reflective of current state
- No brand guidelines or visual identity defined
- No accessibility requirements documented
- No responsive design specifications

### Technical Debt
- 168 TODO markers across 34 files in src/
- Many UI components have styling TODOs
- No design token implementation
- Missing theme provider
- No component testing infrastructure

### Opportunities
- Clean slate for design system implementation
- Clear Mode A (Enterprise) direction from PRISM guidelines
- Strong accessibility requirements from Production Blueprint
- Well-defined component hierarchy needs
- Opportunity to establish consistent patterns early

---

## 🔗 RELEVANT DOCUMENTATION REFERENCES

- **PRISM Agent Definition:** `Docs/Agents/PRISM -Jaydr DesignSystem Agent.md`
- **Production Blueprint:** `Docs/Production Blueprint and Delivery Guide.md`
- **Technical Wiki:** `TECHNICAL_WIKI.md`
- **Frontend UI Component Tree:** `Docs/Frontend UI Component Tree.md` (aspirational)
- **Project Concept:** `Docs/Jaydr Ghostcart Project Concept.txt` (vision/brainstorm)
- **README:** `README.md`

---

## 🛠️ AGENT SKILLS CATALOG

### Available Design-Related Skills

**High Confidence - Directly Relevant:**
- **shadcn** - Manages shadcn/ui components and projects, providing context, documentation, and usage patterns for building modern design systems. *Excellent fit given PRISM's Mode A hierarchy places shadcn/ui as option #3.*
- **frontend-design** - Create distinctive, production-grade frontend interfaces with intentional aesthetics, high craft, and non-generic visual identity. *Useful for brand identity and visual differentiation work.*

**Medium Confidence - Potentially Useful:**
- **web-design-guidelines** - Review UI code for Web Interface Guidelines compliance. Use for accessibility audits and design reviews.

**Low Confidence - Context-Dependent:**
- **awesome-design-md-main** - Design resources (directory empty, needs investigation)
- Multiple SEO, marketing, and content skills (not directly relevant to core design system work)

### Skills Confidence Chart

| Skill | Relevance | Confidence | Notes |
|-------|-----------|-------------|-------|
| shadcn | ⭐⭐⭐⭐⭐ | HIGH | Direct alignment with PRISM's component hierarchy |
| frontend-design | ⭐⭐⭐⭐ | HIGH | Useful for brand identity and visual differentiation |
| web-design-guidelines | ⭐⭐⭐ | MEDIUM | Good for audits and compliance checks |
| awesome-design-md-main | ⭐⭐ | LOW | Directory empty, needs investigation |

### Skills Integration Strategy
- **Primary:** Use shadcn skill for component library implementation and management
- **Secondary:** Use frontend-design skill for brand identity and visual differentiation work
- **Tertiary:** Use web-design-guidelines for accessibility audits and design reviews

---

## 🎨 DESIGN SYSTEM INSPIRATION ANALYSIS

### awesome-design-md-main Collection Survey

**Collection Overview:** 55+ DESIGN.md files from real websites, covering AI/ML, developer tools, infrastructure, design/productivity, fintech/crypto, and enterprise/consumer categories.

### High-Relevance Design Systems for GhostCart

#### 1. **Linear** ⭐⭐⭐⭐⭐ (EXCELLENT FIT)

**Why it aligns with GhostCart:**
- **Mode A Perfect Match:** Dark-mode-native with extreme precision engineering aesthetic
- **Enterprise Focus:** Designed for project management and engineering teams
- **Information Density:** Manages high information density through subtle luminance gradations
- **Technical Credibility:** Inter Variable with OpenType features creates developer trust
- **Sophisticated Depth:** Multi-layer shadow system with inset variants for dark surfaces

**Applicable Patterns:**
- Semi-transparent white borders (`rgba(255,255,255,0.05)` to `rgba(255,255,255,0.08)`)
- Luminance stacking model for elevation on dark backgrounds
- Signature weight 510 (between regular and medium) for UI text
- Aggressive negative letter-spacing at display sizes
- Brand indigo-violet accent used sparingly for CTAs only

**Potential Use Cases:**
- Dark mode implementation reference
- Complex data table design patterns
- Command palette and search interfaces
- Multi-layer shadow system for cards and modals
- Typography hierarchy for dense interfaces

---

#### 2. **Supabase** ⭐⭐⭐⭐⭐ (EXCELLENT FIT)

**Why it aligns with GhostCart:**
- **Developer-First:** Born in terminal window, evolved into sophisticated marketing surface
- **Technical Foundation:** Built on PostgreSQL (same as GhostCart)
- **Enterprise-Ready:** Open-source Firebase alternative with enterprise features
- **HSL Token System:** Sophisticated HSL-based color tokens with alpha channels
- **Minimal Shadows:** Depth through border contrast and transparency

**Applicable Patterns:**
- HSL-based color token system with alpha channels for translucent layering
- Emerald green brand accent used sparingly as identity marker
- Circular font with rounded terminals for warmth in technical interface
- Border hierarchy for depth instead of shadows
- Pill buttons (9999px) for primary CTAs, 6px radius for secondary

**Potential Use Cases:**
- Color token system architecture
- Developer documentation design patterns
- API reference and code display styling
- Technical dashboard layouts
- Brand accent application strategy

---

#### 3. **HashiCorp** ⭐⭐⭐⭐ (STRONG FIT)

**Why it aligns with GhostCart:**
- **Enterprise Infrastructure:** Designed for cloud infrastructure management
- **Multi-Product System:** Each product has its own brand color within unified system
- **Dual-Mode Design:** Clean white sections + dramatic dark hero areas
- **Token-Driven:** `mds` (Markdown Design System) prefix with CSS custom properties
- **Enterprise Confidence:** Heavy weights (600-700) with tight line-heights

**Applicable Patterns:**
- Multi-product color system via CSS custom properties
- Uppercase letter-spaced captions for wayfinding
- Micro-shadows (0.05 opacity) for subtle elevation
- Custom brand font for headings, system-ui for body
- Token-driven component system with semantic variable names

**Potential Use Cases:**
- Multi-tenant color system architecture
- Enterprise-grade typography hierarchy
- Token-driven design system implementation
- Dark/light mode dual-pattern reference
- Product-specific accent color strategy

---

#### 4. **Stripe** ⭐⭐⭐⭐ (STRONG FIT)

**Why it aligns with GhostCart:**
- **Fintech Excellence:** Gold standard for financial platform design
- **Technical + Luxurious:** Simultaneously technical and premium
- **Blue-Tinted Shadows:** Multi-layer shadows with brand-colored depth
- **Weight 300 Signature:** Light weight headlines create confident authority
- **Precision Spacing:** Dense small-end scale for financial data displays

**Applicable Patterns:**
- Blue-tinted multi-layer shadows (`rgba(50,50,93,0.25)`)
- Weight 300 as signature headline weight (anti-convention)
- Conservative border-radius (4px-8px) for enterprise feel
- Deep navy (`#061b31`) headings instead of black
- Tabular numerals via `"tnum"` for financial data

**Potential Use Cases:**
- Financial data display patterns
- Multi-layer shadow system for brand consistency
- Typography for data-dense interfaces
- Enterprise button and form patterns
- Color system for fintech-grade trust

---

#### 5. **Vercel** ⭐⭐⭐ (MODERATE FIT)

**Why it's relevant:**
- **Developer Infrastructure:** Frontend deployment platform
- **Shadow-as-Border:** Innovative `box-shadow: 0px 0px 0px 1px` technique
- **Geist Font:** Custom font with aggressive negative letter-spacing
- **Workflow Colors:** Ship Red, Preview Pink, Develop Blue for pipeline stages
- **Minimalist Philosophy:** Gallery-like emptiness where elements earn their pixel

**Applicable Patterns:**
- Shadow-as-border technique for smoother transitions
- Multi-layer shadow stacks with specific architectural purposes
- Geist Sans with extreme negative letter-spacing
- Workflow-specific accent colors for pipeline visualization
- Minimal color palette (achromatic grays)

**Potential Use Cases:**
- Shadow system innovation reference
- Pipeline/workflow visualization patterns
- Minimalist design philosophy for complex systems
- Custom font integration strategies
- Focus ring system for accessibility

---

#### 6. **PostHog** ⭐⭐ (CONTEXT-SPECIFIC FIT)

**Why it's relevant:**
- **Developer Analytics:** Product analytics platform
- **Warm Personality:** Sage/olive palette instead of conventional blues
- **Hidden Brand Color:** Orange (`#F54E00`) appears only on hover
- **Playful Illustrations:** Hand-drawn hedgehog art for personality
- **Content-Heavy:** Editorial layout optimized for long sessions

**Applicable Patterns:**
- Hidden brand color that only appears on hover (delightful surprise)
- IBM Plex Sans Variable at bold weights for headings
- Warm sage/olive color palette for approachable technical feel
- Opacity-based hover states rather than color shifts
- Content-heavy editorial layout patterns

**Potential Use Cases:**
- Hidden interaction patterns for delight
- Warm color palette alternatives to conventional blues
- Content-heavy dashboard layouts
- Playful personality integration in enterprise tools
- Hover state innovation

---

### Medium-Relevance Design Systems

#### 7. **Notion** ⭐⭐ (MODERATE FIT)
- **Warm Neutrals:** Yellow-brown undertones for approachable minimalism
- **Ultra-Thin Borders:** `1px solid rgba(0,0,0,0.1)` whisper-weight division
- **Multi-Layer Shadows:** Sub-0.05 opacity for barely-there depth
- **NotionInter Font:** Modified Inter with negative letter-spacing
- **Applicable for:** Warm minimalism, border philosophy, shadow restraint

#### 8. **Coinbase** ⭐⭐ (MODERATE FIT)
- **Financial Trust:** Blue-and-white binary for reliability
- **Proprietary Fonts:** Four-font system (Display, Sans, Text, Icons)
- **Pill Buttons:** 56px radius for distinctive CTAs
- **Near-Black Sections:** Professional financial-grade interface
- **Applicable for:** Fintech trust patterns, proprietary font strategy, pill button design

---

### Design System Confidence Matrix

| Design System | Enterprise Fit | Technical Fit | Innovation | Implementation | Overall |
|---------------|----------------|--------------|------------|----------------|---------|
| Linear | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Supabase | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| HashiCorp | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Stripe | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Vercel | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| PostHog | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Notion | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Coinbase | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐ |

---

### Recommended Integration Strategy

**Primary References (Study & Adapt):**
1. **Linear** - Dark mode patterns, shadow system, typography hierarchy
2. **Supabase** - Color token system, developer-first patterns
3. **HashiCorp** - Multi-product color system, enterprise typography

**Secondary References (Selective Inspiration):**
4. **Stripe** - Financial data patterns, blue-tinted shadows
5. **Vercel** - Shadow-as-border technique, workflow colors

**Tertiary References (Context-Specific):**
6. **PostHog** - Hidden interaction patterns, warm palette alternatives
7. **Notion** - Border philosophy, shadow restraint
8. **Coinbase** - Fintech trust patterns, pill buttons

---

## 🎨 DESIGN SYSTEM REVISION (2026-08-17)

### Island Interface & Warm Cream / Burgundy Palette
- **Palette Adoption:** Adopted Coolors palette (`#f3f1ef`, `#e0dbd8`, `#791228`, `#55121e`, `#0d0d0d`).
- **Layout Architecture:** Shifted from boxed containers to a floating "Island Interface" where search bar, floating sidebar icons, and cards hover over `#f3f1ef` background.
- **Button Contrast Rules:** Required explicit solid `#e0dbd8` background with `#6b7280` text for disabled primary buttons to guarantee high contrast visibility against `#f3f1ef` light surfaces.

