# TGD Design Agent Command Center
## Web App, Docker App & Responsive Design Field Guide

**Version:** 1.0  
**Date:** August 2026  
**Purpose:** Route design/frontend tasks to the correct specialized agent or skill  
**Audience:** Design agents, frontend engineers, and task orchestration bots working on The Gorgeous Diaries (TGD) digital product stack

---

## Overview

This document is a **routing playbook** for design work. It maps **task triggers** → **best-fit skill(s)** → **expected outputs & constraints**.

Think of it as a **CPU dispatch scheduler** for the TGD design pipeline. When a task arrives, scan the triggers below to find the right agent.

---

## The Core Design Stack (7 Skills)

### **1. FRONTEND DESIGN** (Aesthetic Authority)
**Role:** Visual identity architect + code translator  
**Handles:** Distinctive, non-generic UI styling  
**Invokes itself when:**
- **You're building ANY web/app UI** (pages, components, dashboards, landing pages)
- **Aesthetic direction is undefined or weak** ("make it look better")
- **Design needs to be memorable, not default** (avoid AI slop)
- **Expressing a design thesis** (retro-futurist, brutalist, luxury minimal, etc.)

**Mandatory thinking phase BEFORE code:**
1. Define **Purpose** — what action should this enable?
2. Define **Tone** — pick ONE dominant aesthetic direction (brutalist, editorial, luxury, retro-futurist, industrial, organic, playful, etc.)
3. Calculate **DFII** (Design Feasibility & Impact Index: -5 to +15)
   - Aesthetic Impact (1–5)
   - Context Fit (1–5)
   - Implementation Feasibility (1–5)
   - Performance Safety (1–5)
   - Minus: Consistency Risk (1–5)
   - **Threshold:** ≥8 to proceed; <4 = rethink aesthetic

**Key constraints:**
- ❌ NO default layouts or "safe" palettes
- ❌ NO design-by-component without a thesis
- ✅ Strong opinions, well executed
- ✅ Technical correctness (working code, not mockups)
- ✅ Visual memorability (at least one element remembered 24h later)

**Output:** Production-ready HTML/CSS/React component with a named aesthetic direction, not a figma mockup.

---

### **2. FRONTEND DEVELOPER** (Implementation Specialist)
**Role:** React + Next.js + state management expert  
**Handles:** Component building, responsive layouts, client-side logic  
**Invokes itself when:**
- Building actual React components (not just styling)
- Implementing responsive layouts (mobile-first)
- Managing client-side state (useState, context, Zustand, etc.)
- Fixing performance issues (lazy loading, code splitting, bundle size)
- Handling async data fetching, error states, loading UI
- Working with React 19, Next.js 15, TypeScript

**Key responsibilities:**
- Uses **FRONTEND DESIGN** for aesthetic questions
- Uses **TAILWIND DESIGN SYSTEM** or **RADIX-UI** for component structure
- Never hardcodes spacing/colors (always use design tokens)
- Always thinks mobile-first
- Always implements error boundaries and suspense patterns

**Expected output:** Working .tsx/.jsx files with proper TypeScript, responsive breakpoints, and state management.

---

### **3. TAILWIND DESIGN SYSTEM** (Token + Pattern Authority)
**Role:** Utility-first CSS framework + scalable theming  
**Handles:** Design tokens, component variants, responsive patterns, Tailwind v4 specifics  
**Invokes itself when:**
- Building a component library from scratch
- Implementing design tokens (spacing, colors, typography, shadows)
- Using container queries or modern Tailwind v4 features
- Defining responsive breakpoints (sm, md, lg, xl, 2xl)
- Creating consistent utility class naming conventions
- Solving "how do we scale this design system across 50 components?"

**Key constraints:**
- CSS-first configuration (Tailwind v4 way)
- Zero hardcoded values; all values must be in `tailwind.config.ts`
- Support container queries for responsive components
- Design tokens should be semantic (e.g., `--color-primary-brand`, not `--color-blue-500`)

**When to use instead of RADIX-UI:**
- You want pre-styled, opinionated components
- You're building a Tailwind-first design system
- Performance is critical (smaller bundle than Radix + custom CSS)

**Output:** A `tailwind.config.ts` file with all tokens defined, example component library, and documentation of class naming conventions.

---

### **4. RADIX-UI DESIGN SYSTEM** (Headless Primitive Authority)
**Role:** Unstyled accessible components + full customization  
**Handles:** Accessible primitives, compound component patterns, zero style opinions  
**Invokes itself when:**
- You need maximum customization (Tailwind + Radix combo)
- Building a design system that must be **truly brand-unique** (not shadcn templates)
- Accessibility is paramount (WCAG 2.1 AA compliance required)
- You want **no style opinion** from the component library (you bring the CSS)
- Building complex interactive patterns (dialogs, popovers, dropdowns, etc.)

**Combo pattern (recommended for TGD):**
```
FRONTEND DESIGN (aesthetic thesis)
  ↓
RADIX-UI (unstyled accessible components)
  ↓
TAILWIND (style with design tokens)
  ↓
FRONTEND DEVELOPER (wire up interactivity + state)
```

**Key advantages over shadcn:**
- No pre-styled components to override
- Full control over every pixel
- Better for highly branded work

**Output:** Compound component patterns in React (Dialog, Popover, Select, etc.) + Tailwind styling layer.

---

### **5. ACCESSIBILITY COMPLIANCE** (WCAG Authority)
**Role:** WCAG 2.1 AA auditor + remediation guide  
**Handles:** Audit findings, ARIA labels, keyboard navigation, color contrast, focus management  
**Invokes itself when:**
- **MANDATORY:** Before any component ships to production
- Reviewing semantic HTML (nav, main, section tags)
- Testing keyboard navigation (Tab, Enter, Escape, Arrow keys)
- Auditing color contrast (WCAG AA = 4.5:1 text, 3:1 graphics)
- Fixing screen reader issues (missing alt text, ARIA labels)
- Testing form error messages and validation feedback
- Any interactive control (button, dialog, dropdown, slider)

**Workflow:**
1. Run accessibility audit on existing code
2. Identify failures (Critical, High, Medium, Low)
3. Provide remediation code + explanations
4. Re-test after fixes

**Key integration:**
- FRONTEND DEVELOPER calls this BEFORE merging
- FRONTEND DESIGN consults this during aesthetic planning to ensure performance/accessibility balance
- Every color decision runs through WCAG contrast checker

**Output:** Audit report + remediated code snippets. No component leaves FRONTEND DEVELOPER without accessibility sign-off.

---

### **6. DOCKER EXPERT** (Containerization Authority)
**Role:** Containerization, image optimization, deployment orchestration  
**Handles:** Multi-stage builds, security hardening, Docker Compose, production deployment  
**Invokes itself when:**
- Building the Docker image for TGD's web app
- Optimizing image size (keep <200MB for fast CI/CD)
- Setting up multi-stage builds (dev layer vs. prod layer)
- Defining health checks, entrypoints, environment variables
- Orchestrating services (app + database + cache) with Docker Compose
- Hardening container security (non-root user, read-only filesystems, secret management)
- Setting up CI/CD pipeline for Docker builds

**Key responsibilities:**
- Works downstream of FRONTEND DEVELOPER (takes built app, containerizes it)
- Must know Next.js/React build output structure
- Never commits secrets into Dockerfile
- Always uses .dockerignore to exclude node_modules, .next, build artifacts

**Example workflow for TGD:**
```dockerfile
# Stage 1: builder (Next.js build)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: runner (minimal production image)
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
```

**Output:** Dockerfile + docker-compose.yml + deployment documentation (AWS ECS, Render, Railway, etc.).

---

### **7. UI/UX PRO MAX** (Design Intelligence Reference)
**Role:** Comprehensive design reference encyclopedia  
**Handles:** 50+ UI styles, 21 color palettes, 50 font pairings, 9 tech stacks, 99 UX guidelines  
**Invokes itself when:**
- **Design inspiration is needed** ("what design system patterns exist for this use case?")
- **Palette / font pairing decisions** are being made
- **Component pattern research** (tables, cards, forms, etc. across multiple design systems)
- **Rapid prototyping** needs reference patterns quickly
- **Multi-platform design** (React, Vue, Svelte, Tailwind, shadcn, React Native, Flutter, SwiftUI)
- **Chart/data viz references** (20+ chart types)

**NOT a replacement for FRONTEND DESIGN or RADIX-UI.** This is the **reference library**, not the executer.

**Use model:**
- FRONTEND DESIGN: "I want a brutalist editorial card layout"
- UI/UX PRO MAX: "Here are 5 brutalist card examples from existing design systems + font/color pairings"
- FRONTEND DESIGN: "I'll remix these into something new"

**Output:** Inspiration sets, pattern references, palette/typography combinations. No production code from this skill.

---

## Decision Tree: Which Skill to Call?

```
TASK ARRIVES
  │
  ├─ "Design a component / page / dashboard"
  │  └─→ FRONTEND DESIGN (aesthetic)
  │      ↓ (if need structure)
  │      └─→ RADIX-UI or TAILWIND (implementation)
  │
  ├─ "I need responsive React component"
  │  └─→ FRONTEND DEVELOPER (build it)
  │      ↓ (consulting)
  │      └─→ FRONTEND DESIGN (for how it looks)
  │
  ├─ "Design tokens, spacing scale, color system"
  │  └─→ TAILWIND DESIGN SYSTEM
  │      (or RADIX-UI if headless + unstyled)
  │
  ├─ "Make it accessible / WCAG compliant"
  │  └─→ ACCESSIBILITY COMPLIANCE
  │      (always called before ship)
  │
  ├─ "Containerize the app for production"
  │  └─→ DOCKER EXPERT
  │
  ├─ "What design patterns exist for X?"
  │  └─→ UI/UX PRO MAX (reference)
  │      + FRONTEND DESIGN (execution)
  │
  └─ "Orchestrate design workflow"
     └─→ DESIGN ORCHESTRATION (meta-skill)
        (brainstorm → review → execute)
```

---

## Task Trigger Examples

### **Example 1: Build TGD Homepage**
1. **FRONTEND DESIGN** — Define aesthetic (Bureau of Social Intelligence positioning: cold, analytical, systems-forward)
2. **UI/UX PRO MAX** — Research editorial brutalism + premium minimal palettes
3. **RADIX-UI** — Define semantic HTML structure (nav, hero, features, CTA, footer)
4. **TAILWIND** — Apply design tokens (brand colors, typography scale, spacing)
5. **FRONTEND DEVELOPER** — Wire up React state, animations, responsive breakpoints
6. **ACCESSIBILITY COMPLIANCE** — Audit keyboard nav, color contrast, ARIA labels
7. **DOCKER EXPERT** — Containerize for deployment

### **Example 2: Build Product Diagnostic Quiz Component**
1. **FRONTEND DESIGN** — Aesthetic direction (playful but analytical, matches TGD tone)
2. **FRONTEND DEVELOPER** — Build React form state (form validation, progress tracking, conditional rendering)
3. **RADIX-UI** — Use Form, Select, Button primitives
4. **TAILWIND** — Style with brand tokens
5. **ACCESSIBILITY COMPLIANCE** — Test form labels, error messages, keyboard navigation
6. (DOCKER: skip, this is just a component)

### **Example 3: Fix Color Contrast Bug**
1. **ACCESSIBILITY COMPLIANCE** — Identify the WCAG violation
2. **TAILWIND** — Adjust color token value
3. **FRONTEND DEVELOPER** — Verify fix doesn't break responsive
4. Redeploy

### **Example 4: Optimize Docker Image Size**
1. **DOCKER EXPERT** — Analyze layers, identify bloat
2. (Call FRONTEND DEVELOPER if need to optimize build output size)
3. Rebuild + test

---

## Integration Rules

### Rule 1: Never Hardcode Values
Every color, spacing, font size, animation duration must come from a design token.

**✅ Correct:**
```tsx
<div className="bg-primary-brand text-white p-spacing-md rounded-radius-base">
```

**❌ Wrong:**
```tsx
<div style={{backgroundColor: '#2D5B8E', padding: '16px'}}>
```

### Rule 2: FRONTEND DESIGN Always Owns Aesthetic Direction
If FRONTEND DEVELOPER or RADIX-UI has a styling question, consult FRONTEND DESIGN first.

### Rule 3: ACCESSIBILITY COMPLIANCE Has Veto Power
If ACCESSIBILITY COMPLIANCE finds a WCAG violation, it blocks merge. All other considerations secondary.

### Rule 4: Mobile-First is Mandatory
All responsive designs start with mobile (320px), then scale up. No desktop-first, then "mobile is broken."

### Rule 5: No Shadcn Templates Without Remixing
Shadcn components must be heavily customized through Tailwind tokens. Using `shadcn/ui button` as-is = instant FRONTEND DESIGN complaint.

**Better:** Use RADIX-UI primitives + Tailwind to build your own button aligned to TGD aesthetic.

### Rule 6: Design Orchestration Owns Workflow
If multiple agents are needed, DESIGN ORCHESTRATION routes them in order:
1. Brainstorm (ideation)
2. Multi-agent review (FRONTEND DESIGN + UI/UX PRO MAX give feedback)
3. Execution ready (task goes to FRONTEND DEVELOPER + RADIX-UI + TAILWIND)

---

## Performance & Deployment Checkpoints

### Before Component Merge
- [ ] FRONTEND DEVELOPER: TypeScript strict mode, no `any` types
- [ ] ACCESSIBILITY COMPLIANCE: WCAG 2.1 AA audit passed
- [ ] FRONTEND DESIGN: Aesthetic review (is it memorable? intentional?)
- [ ] TAILWIND: No hardcoded colors/spacing
- [ ] Bundle size check: component + dependencies <50KB gzipped

### Before App Deployment
- [ ] DOCKER EXPERT: Image size <200MB, multi-stage build, health checks
- [ ] DOCKER EXPERT: Secrets not baked into image
- [ ] FRONTEND DEVELOPER: Next.js build optimized (`npm run build` passes)
- [ ] ACCESSIBILITY COMPLIANCE: Full app audit (homepage + key flows)
- [ ] Performance: Lighthouse score ≥85 (Performance, Accessibility, Best Practices)

---

## Skill Call Syntax (For Orchestration Bots)

When delegating tasks in code or CLI:

```bash
# Aesthetic architecture
@frontend-design "Design a card component for TGD's dating quiz"

# Implementation
@frontend-developer "Build a React form component for the diagnostic quiz"

# Tokens & system
@tailwind-design-system "Define the spacing and color token system"

# Accessibility
@accessibility-compliance "Audit the form for WCAG compliance"

# Deployment
@docker-expert "Containerize the Next.js app for production"

# Reference
@ui-ux-pro-max "Show me 5 examples of playful-but-professional UI in existing design systems"

# Orchestration
@design-orchestration "Route this feature through design → review → implementation"
```

---

## TGD-Specific Design Constraints

### Brand Foundation
- **Aesthetic:** Cold, analytical, systems-forward (Bureau of Social Intelligence)
- **Audience:** Women 18–45+ analyzing dating/relationships with rigor
- **Tone:** Cynical but helpful, not condescending
- **Typography:** Modern sans-serif (Inter, Helvetica Neue, or system fonts) + high-impact serif headlines (Georgia, Playfair)
- **Color Palette:** Dark neutrals (grays, blacks) + accent color (deep jewel tones: sapphire, emerald, burgundy; avoid candy colors)
- **Spacing:** Generous whitespace, 8px grid

### Responsive Breakpoints
- Mobile: 320px–767px (single column, full-width inputs)
- Tablet: 768px–1023px (2 columns, guided layouts)
- Desktop: 1024px+ (3 columns, multi-panel dashboards)

### Accessibility Baseline
- All text ≥16px on mobile (no pinch-zoom needed)
- Button targets ≥44px × 44px (mobile touch)
- Color contrast ≥4.5:1 for text (WCAG AA)
- Keyboard navigation: all interactive elements Tab-able

### Performance SLA
- Lighthouse Performance: ≥85
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

---

## Common Mistakes to Avoid

| Mistake | Symptom | Fix |
|---------|---------|-----|
| **No aesthetic thesis** | "It just looks generic" | Call FRONTEND DESIGN first, define tone before coding |
| **Hardcoded values** | Colors don't match brand, spacing is random | Use TAILWIND token system, never inline styles |
| **Accessibility afterthought** | WCAG failures found in QA | Call ACCESSIBILITY COMPLIANCE during development, not after |
| **Desktop-first responsive** | Mobile is broken, tablet is cramped | Always start 320px mobile, scale up |
| **Shadcn templates without remixing** | Looks like every other app | Use RADIX primitives + custom Tailwind instead |
| **No Docker strategy** | "How do we even deploy this?" | Call DOCKER EXPERT at start of sprint, not end |
| **Inconsistent tokens across components** | Different buttons have different padding | TAILWIND DESIGN SYSTEM owns all token definitions |
| **No design review** | Shipped something the brand team hates | DESIGN ORCHESTRATION routes through review before execution |

---

## When to Call a Multi-Agent Task Force

**Example: Build the TGD Diagnostic Quiz (Tripwire Product)**

```
DESIGN ORCHESTRATION
├── PHASE 1: BRAINSTORM
│   ├── FRONTEND DESIGN: "Aesthetic for a diagnostic quiz? Playful + analytical"
│   ├── UI/UX PRO MAX: "Show examples of quiz UX from Horoscope, Personality Test, Dating App categories"
│   └── OUTPUT: Design thesis + reference patterns
│
├── PHASE 2: REVIEW (Multi-Agent)
│   ├── FRONTEND DESIGN: "Critique the quiz aesthetic"
│   ├── ACCESSIBILITY COMPLIANCE: "Spot accessibility risks early"
│   ├── DOCKER EXPERT: "Data persistence strategy?"
│   └── OUTPUT: Feedback, blockers identified
│
└── PHASE 3: EXECUTION
    ├── FRONTEND DEVELOPER: "Build quiz form component"
    ├── RADIX-UI: "Provide accessible dialog/form primitives"
    ├── TAILWIND: "Apply design tokens for styling"
    ├── ACCESSIBILITY COMPLIANCE: "Final audit before merge"
    └── DOCKER EXPERT: "Containerize for staging deploy"
```

---

## Reference: Full Skill Matrix

| Skill | Aesthetic | Implementation | Tokens | Accessible | Deployment |
|-------|-----------|-----------------|--------|------------|------------|
| FRONTEND DESIGN | ✅ (primary) | ✅ | ❌ | ✓ (consults) | ❌ |
| FRONTEND DEVELOPER | ❌ (consults) | ✅ (primary) | ✓ (uses) | ✓ (consults) | ❌ |
| TAILWIND DESIGN SYSTEM | ❌ | ✓ (supports) | ✅ (primary) | ✓ (includes) | ❌ |
| RADIX-UI DESIGN SYSTEM | ❌ | ✅ (primitives) | ❌ | ✅ (built-in) | ❌ |
| ACCESSIBILITY COMPLIANCE | ❌ | ✓ (validates) | ✓ (validates) | ✅ (primary) | ❌ |
| DOCKER EXPERT | ❌ | ❌ | ❌ | ❌ | ✅ (primary) |
| UI/UX PRO MAX | ❌ | ❌ | ❌ | ❌ | ❌ (reference) |

---

## Escalation & Exceptions

### When FRONTEND DESIGN and FRONTEND DEVELOPER Disagree
→ Escalate to DESIGN ORCHESTRATION for multi-agent review.

### When ACCESSIBILITY COMPLIANCE Conflicts with Aesthetic
→ ACCESSIBILITY COMPLIANCE has veto. Find a design solution that satisfies both.

### When Performance Budget is Blown
→ DOCKER EXPERT + FRONTEND DEVELOPER collaborate on optimization (lazy load, code split, image optimize, etc.).

### When Deployment Fails
→ DOCKER EXPERT diagnoses. May involve FRONTEND DEVELOPER if build output is the issue.

---

## Conclusion

This Command Center is your **routing map** for design work on TGD.

**Golden Rule:** Route tasks to the **lowest-level specialist** that can handle them, never do serial reviews when parallel work suffices, and always run ACCESSIBILITY COMPLIANCE before shipping.

Use this playbook. Refer agents to it. Update it as new skills are added.

**Happy designing.** 🎯

---

**Document Version History:**
- v1.0 (Aug 2026): Initial Command Center, 7-skill stack
- (Future versions will track new skills, integration patterns, and TGD-specific updates)
