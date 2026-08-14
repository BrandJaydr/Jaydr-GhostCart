# Jaydr GhostCart — Frontend UI Component Tree & Design

> **Architecture**: SaaS dashboard inside WordPress admin panel (Phase 1), with standalone React/Next.js app as Phase 2 target.
> **Design System**: Component-based with shadcn/ui primitives (Radix UI + Tailwind CSS).

> **HISTORICAL / ASPIRATIONAL — NOT IMPLEMENTATION AUTHORITY (2026-08-12):** This document describes a WordPress + shadcn future concept, not the current standalone application. The verified baseline is **Next.js 14.2.5, React 18.3.1, HeroUI v2.8.10**; Tailwind v3 is intended but currently missing from the root dependency set. Follow `Prism Working/UI_RECOVERY_BRIEF.md` for active UI decisions.

---

## 1. NAVIGATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOP NAV BAR                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ☰ [Menu Toggle]  GhostCart 🕵️  [Search]  [🔔 Notifications]│  │
│  │                                    [👤 Profile Dropdown ▼]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────┐ ┌──────────────────────────────────────────────────┐  │
│  │ SIDEBAR   │ │ MAIN CONTENT AREA                               │  │
│  │ (260px)   │ │                                                  │  │
│  │           │ │                                                  │  │
│  │ 📊 Main   │ │   [Breadcrumbs]                                  │  │
│  │  ├─ Dashboard  │   ┌────────────────────────────────────────┐ │  │
│  │  ├─ Import     │   │                                        │ │  │
│  │  ├─ Library    │   │   Page Content                         │ │  │
│  │  ├─ Listings   │   │   (varies by page)                     │ │  │
│  │  │  ├─ Rewrite │   │                                        │ │  │
│  │  │  ├─ Export  │   └────────────────────────────────────────┘ │  │
│  │  │  └─ Live    │                                              │  │
│  │  ├─ Pricing    │                                              │  │
│  │  │  ├─ Tracking│                                              │  │
│  │  │  └─ Rules   │                                              │  │
│  │  ├─ Orders     │                                              │  │
│  │  ├─ Analytics  │                                              │  │
│  │  ├─ Health     │                                              │  │
│  │  │                                                                     │
│  │  ├─ ⚙️ Settings │                                              │  │
│  │  │  ├─ General  │                                              │  │
│  │  │  ├─ Marketplaces│                                           │  │
│  │  │  ├─ Suppliers│                                              │  │
│  │  │  ├─ Pricing  │                                              │  │
│  │  │  ├─ Notifications│                                         │  │
│  │  │  └─ Team     │                                              │  │
│  │  │                                                                     │
│  │  ├─ 👤 Profile │                                              │  │
│  │  │                                                                     │
│  │  └─ 📄 Logs    │                                              │  │
│  └──────────┘ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. FULL FILE / COMPONENT TREE

```
src/
├── app/                              # Next.js App Router pages
│   ├── layout.tsx                    # Root layout (sidebar + topbar wrapper)
│   ├── page.tsx                      # Redirect to /dashboard
│   ├── login/
│   │   └── page.tsx                  # Login page
│   ├── register/
│   │   └── page.tsx                  # Registration page
│   ├── forgot-password/
│   │   └── page.tsx                  # Password reset
│   │
│   ├── dashboard/
│   │   └── page.tsx                  # Main dashboard overview
│   │
│   ├── import/
│   │   ├── page.tsx                  # Import products page
│   │   └── [id]/
│   │       └── page.tsx              # Import result detail
│   │
│   ├── library/
│   │   ├── page.tsx                  # Product library grid/table
│   │   ├── [id]/
│   │   │   ├── page.tsx              # Product detail
│   │   │   └── edit/
│   │   │       └── page.tsx          # Edit product
│   │   └── categories/
│   │       └── page.tsx              # Category management
│   │
│   ├── listings/
│   │   ├── page.tsx                  # All listings overview
│   │   ├── rewrite/
│   │   │   ├── page.tsx              # AI listing rewrite
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Rewrite detail/editor
│   │   ├── export/
│   │   │   ├── page.tsx              # Export to marketplace
│   │   │   └── history/
│   │   │       └── page.tsx          # Export history
│   │   └── live/
│   │       └── page.tsx              # Live marketplace listings
│   │
│   ├── pricing/
│   │   ├── page.tsx                  # Price tracking overview
│   │   ├── history/
│   │   │   └── page.tsx              # Price history charts
│   │   └── rules/
│   │       ├── page.tsx              # Auto-repricing rules
│   │       └── new/
│   │           └── page.tsx          # New rule wizard
│   │
│   ├── orders/
│   │   ├── page.tsx                  # All orders
│   │   ├── [id]/
│   │   │   └── page.tsx              # Order detail
│   │   └── fulfillment/
│   │       └── page.tsx              # Fulfillment queue
│   │
│   ├── analytics/
│   │   ├── page.tsx                  # Main analytics dashboard
│   │   ├── profit/
│   │   │   └── page.tsx              # Profit & loss
│   │   ├── products/
│   │   │   └── page.tsx              # Product performance
│   │   ├── marketplaces/
│   │   │   └── page.tsx              # Per-marketplace metrics
│   │   └── reports/
│   │       └── page.tsx              # Scheduled/generated reports
│   │
│   ├── health/
│   │   ├── page.tsx                  # Account health overview
│   │   ├── marketplace/
│   │   │   └── [marketplace]/
│   │   │       └── page.tsx          # Per-marketplace health
│   │   └── alerts/
│   │       └── page.tsx              # Risk alerts & warnings
│   │
│   ├── settings/
│   │   ├── page.tsx                  # General settings (redirect)
│   │   ├── general/
│   │   │   └── page.tsx              # General / store settings
│   │   ├── marketplaces/
│   │   │   ├── page.tsx              # Marketplace connections
│   │   │   └── connect/
│   │   │       └── [type]/
│   │   │           └── page.tsx      # OAuth flow per marketplace
│   │   ├── suppliers/
│   │   │   ├── page.tsx              # Supplier management
│   │   │   └── new/
│   │   │       └── page.tsx          # Add custom supplier
│   │   ├── pricing/
│   │   │   └── page.tsx              # Default pricing config
│   │   ├── notifications/
│   │   │   └── page.tsx              # Notification preferences
│   │   ├── team/
│   │   │   ├── page.tsx              # Team members
│   │   │   └── invites/
│   │   │       └── page.tsx          # Pending invites
│   │   ├── api/
│   │   │   └── page.tsx              # API key management
│   │   └── billing/
│   │       ├── page.tsx              # Billing & plans
│   │       └── invoices/
│   │           └── page.tsx          # Invoice history
│   │
│   ├── profile/
│   │   ├── page.tsx                  # Profile overview
│   │   └── security/
│   │       └── page.tsx              # Security settings (2FA, sessions)
│   │
│   └── logs/
│       └── page.tsx                  # System & activity logs
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx              # Main layout wrapper
│   │   ├── Sidebar.tsx               # Collapsible sidebar navigation
│   │   ├── SidebarItem.tsx           # Single sidebar nav item
│   │   ├── SidebarSection.tsx        # Section group in sidebar
│   │   ├── TopNav.tsx                # Top navigation bar
│   │   ├── Breadcrumbs.tsx           # Breadcrumb trail
│   │   ├── MobileNav.tsx             # Mobile bottom nav
│   │   └── PageHeader.tsx            # Consistent page header
│   │
│   ├── common/
│   │   ├── Button.tsx                # Base button (variants: primary, secondary, ghost, danger)
│   │   ├── IconButton.tsx            # Icon-only button
│   │   ├── Input.tsx                 # Text input
│   │   ├── Select.tsx                # Dropdown select
│   │   ├── SearchInput.tsx           # Search box with icon
│   │   ├── Badge.tsx                 # Status badge
│   │   ├── Card.tsx                  # Content card
│   │   ├── StatCard.tsx              # KPI stat card
│   │   ├── DataTable.tsx             # Sortable/filterable table
│   │   ├── DataTablePagination.tsx   # Table pagination
│   │   ├── TableFilters.tsx          # Filter bar for tables
│   │   ├── Modal.tsx                 # Base modal/dialog
│   │   ├── ConfirmDialog.tsx         # Confirmation dialog
│   │   ├── Toast.tsx                 # Toast notification
│   │   ├── Spinner.tsx               # Loading spinner
│   │   ├── Skeleton.tsx              # Skeleton loader
│   │   ├── EmptyState.tsx            # Empty state placeholder
│   │   ├── ErrorBoundary.tsx         # Error fallback UI
│   │   ├── Tooltip.tsx               # Tooltip
│   │   ├── DropdownMenu.tsx          # Dropdown menu
│   │   ├── Tabs.tsx                  # Tab navigation
│   │   ├── Toggle.tsx                # Toggle switch
│   │   ├── ProgressBar.tsx           # Progress bar
│   │   ├── FileUpload.tsx            # File upload zone
│   │   ├── Avatar.tsx                # User avatar
│   │   └── CopyButton.tsx            # Copy to clipboard
│   │
│   ├── dashboard/
│   │   ├── DashboardGrid.tsx         # Dashboard widget grid
│   │   ├── WidgetStatRow.tsx         # Top stat row (4 cards)
│   │   │   ├── TotalProductsCard.tsx
│   │   │   ├── ActiveListingsCard.tsx
│   │   │   ├── PendingOrdersCard.tsx
│   │   │   └── EstimatedProfitCard.tsx
│   │   ├── WidgetRecentImports.tsx   # Recent imports panel
│   │   ├── WidgetPriceChanges.tsx    # Recent price changes
│   │   ├── WidgetQuickActions.tsx    # Quick action buttons
│   │   ├── WidgetHealthScore.tsx     # Account health gauge
│   │   ├── WidgetProfitChart.tsx     # Profit over time (line chart)
│   │   ├── WidgetTopProducts.tsx     # Best performing products
│   │   └── WidgetActivityFeed.tsx    # Recent activity stream
│   │
│   ├── import/
│   │   ├── ImportForm.tsx            # URL input + supplier select
│   │   ├── ImportBulkForm.tsx        # Bulk URL import
│   │   ├── ImportPreview.tsx         # Product preview card
│   │   ├── ImportProgress.tsx        # Import progress indicator
│   │   ├── ImportResult.tsx          # Import success/detail
│   │   └── ImportHistory.tsx         # Past imports list
│   │
│   ├── library/
│   │   ├── ProductTable.tsx          # Main product table
│   │   ├── ProductCard.tsx           # Grid view product card
│   │   ├── ProductFilters.tsx        # Filter sidebar/bar
│   │   ├── ProductDetailPanel.tsx    # Slide-out detail panel
│   │   ├── ProductImages.tsx         # Image gallery
│   │   ├── ProductActions.tsx        # Action buttons per product
│   │   ├── CategoryTree.tsx          # Category navigation tree
│   │   └── ProductBulkActions.tsx    # Bulk select + action bar
│   │
│   ├── listings/
│   │   ├── RewriteEditor.tsx         # Main rewrite interface
│   │   ├── RewritePreview.tsx        # Side-by-side original vs AI
│   │   ├── TitleEditor.tsx           # Title field with AI suggestions
│   │   ├── DescriptionEditor.tsx     # Rich text editor
│   │   ├── KeywordEditor.tsx         # SEO keyword tag editor
│   │   ├── MarketplaceVariant.tsx    # Per-marketplace listing variant
│   │   ├── StyleSelector.tsx         # Premium/Budget/Emotional toggle
│   │   ├── LanguageSelector.tsx      # Multi-language select
│   │   ├── ABTestPanel.tsx           # A/B test versioning
│   │   ├── ExportWizard.tsx          # Multi-step export wizard
│   │   ├── ExportTargetSelect.tsx    # Choose marketplaces to export to
│   │   ├── CategoryMapper.tsx        # Map product to marketplace category
│   │   ├── ExportProgress.tsx        # Publishing progress tracker
│   │   ├── ExportHistory.tsx         # Past exports list
│   │   ├── LiveListingsTable.tsx     # Active marketplace listings
│   │   └── ListingStatusBadge.tsx    # Status indicator per marketplace
│   │
│   ├── pricing/
│   │   ├── PriceTrackingTable.tsx    # Price monitoring table
│   │   ├── PriceHistoryChart.tsx     # Historical price chart
│   │   ├── PriceChangeAlert.tsx      # Price change notification card
│   │   ├── RepricingRulesList.tsx    # List of repricing rules
│   │   ├── RepricingRuleCard.tsx     # Single rule display
│   │   ├── RepricingRuleForm.tsx     # Create/edit rule form
│   │   ├── RuleConditionBuilder.tsx  # If/Then rule builder
│   │   ├── MarginCalculator.tsx      # Live margin calculator
│   │   ├── CompetitiveAnalysis.tsx   # Competitor price comparison
│   │   └── PriceSimulator.tsx        # What-if price simulation
│   │
│   ├── orders/
│   │   ├── OrdersTable.tsx           # Order listing table
│   │   ├── OrderFilters.tsx          # Order status/marketplace filters
│   │   ├── OrderDetail.tsx           # Order detail view
│   │   ├── OrderTimeline.tsx         # Order status timeline
│   │   ├── FulfillmentQueue.tsx      # Items pending fulfillment
│   │   ├── FulfillmentCard.tsx       # Single fulfillment task
│   │   ├── SupplierOrderForm.tsx     # Auto-place supplier order
│   │   ├── TrackingInput.tsx         # Tracking number input
│   │   └── OrderActions.tsx          # Action buttons (fulfill, cancel, refund)
│   │
│   ├── analytics/
│   │   ├── AnalyticsOverview.tsx     # Summary metrics row
│   │   ├── ProfitChart.tsx           # Profit line/bar chart
│   │   ├── RevenueChart.tsx          # Revenue chart
│   │   ├── MarketplaceBreakdown.tsx  # Per-marketplace pie chart
│   │   ├── ProductPerformanceTable.tsx # Top/worst products
│   │   ├── CategoryHeatmap.tsx       # Category performance heatmap
│   │   ├── TrendChart.tsx            # Trend line chart
│   │   ├── ReportsList.tsx           # Saved/generated reports
│   │   ├── ReportBuilder.tsx         # Custom report builder
│   │   ├── ExportReportButton.tsx    # PDF/CSV export
│   │   └── DateRangePicker.tsx       # Date range selector
│   │
│   ├── health/
│   │   ├── HealthScoreGauge.tsx      # Overall health score gauge
│   │   ├── MarketplaceHealthCard.tsx # Per-marketplace health card
│   │   ├── MetricRow.tsx             # Individual metric display
│   │   ├── RiskAlertCard.tsx         # Warning/risk alert
│   │   ├── RiskTrendChart.tsx        # Risk score over time
│   │   ├── SuggestionsList.tsx       # AI improvement suggestions
│   │   └── HealthTimeline.tsx        # Account events timeline
│   │
│   ├── settings/
│   │   ├── SettingsNav.tsx           # Settings sub-navigation
│   │   ├── GeneralSettings.tsx       # Store name, timezone, currency
│   │   ├── MarketplaceConnections.tsx # Connected/available marketplaces
│   │   ├── MarketplaceConnectCard.tsx # Individual marketplace card
│   │   ├── OAuthCallback.tsx         # OAuth redirect handler
│   │   ├── SupplierList.tsx          # Supplier management table
│   │   ├── SupplierForm.tsx          # Add/edit supplier form
│   │   ├── DefaultPricingForm.tsx    # Default markup, fees, margins
│   │   ├── NotificationPreferences.tsx # Toggle notifications per type
│   │   ├── TeamMembersTable.tsx      # Team members list
│   │   ├── TeamMemberRow.tsx         # Single team member
│   │   ├── InviteUserForm.tsx        # Send invite form
│   │   ├── RoleSelector.tsx          # Permission role dropdown
│   │   ├── ApiKeyManager.tsx         # API key generation/revocation
│   │   ├── ApiKeyRow.tsx             # Single API key display
│   │   ├── BillingPlanCard.tsx       # Plan card (Free/Pro/Enterprise)
│   │   ├── SubscriptionStatus.tsx    # Current plan + usage
│   │   └── InvoiceTable.tsx          # Invoice history table
│   │
│   ├── profile/
│   │   ├── ProfileForm.tsx           # Name, email, avatar edit
│   │   ├── PasswordForm.tsx          # Change password
│   │   ├── TwoFactorSetup.tsx        # 2FA enable/disable
│   │   ├── ActiveSessions.tsx        # Active login sessions
│   │   ├── SessionRow.tsx            # Single session display
│   │   └── DeleteAccount.tsx         # Account deletion zone
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx             # Email/password + SSO buttons
│   │   ├── RegisterForm.tsx          # Registration form
│   │   ├── ForgotPasswordForm.tsx    # Password reset email
│   │   ├── ResetPasswordForm.tsx     # New password form
│   │   ├── SocialLoginButtons.tsx    # Google/GitHub login buttons
│   │   └── AuthGuard.tsx             # Route protection wrapper
│   │
│   ├── logs/
│   │   ├── LogViewer.tsx             # Main log display
│   │   ├── LogFilters.tsx            # Filter by type/date/service
│   │   ├── LogEntry.tsx              # Single log line
│   │   ├── LogDetail.tsx             # Expanded log detail
│   │   └── LogExport.tsx             # Export logs button
│   │
│   └── notifications/
│       ├── NotificationBell.tsx      # Bell icon with badge count
│       ├── NotificationPanel.tsx     # Slide-out notification list
│       ├── NotificationItem.tsx      # Single notification
│       └── NotificationToast.tsx     # Real-time toast popup
│
├── hooks/
│   ├── useAuth.ts                    # Authentication state
│   ├── useProducts.ts                # Product CRUD operations
│   ├── useListings.ts                # Listing operations
│   ├── useOrders.ts                  # Order operations
│   ├── usePricing.ts                 # Price tracking
│   ├── useAnalytics.ts               # Analytics data
│   ├── useNotifications.ts           # Notification state
│   ├── useWebSocket.ts               # Real-time connection
│   ├── useDebounce.ts                # Debounce utility
│   ├── useMediaQuery.ts              # Responsive breakpoints
│   └── usePagination.ts              # Pagination state
│
├── stores/
│   ├── authStore.ts                  # Zustand auth store
│   ├── productStore.ts               # Product state
│   ├── listingStore.ts               # Listing state
│   ├── uiStore.ts                    # Sidebar, theme, UI state
│   └── notificationStore.ts          # Notification state
│
├── lib/
│   ├── api-client.ts                 # Axios/fetch wrapper
│   ├── socket.ts                     # WebSocket client
│   ├── utils.ts                      # Formatting, date, currency helpers
│   └── validators.ts                 # Form validation schemas
│
├── types/
│   ├── product.ts                    # Product interfaces
│   ├── listing.ts                    # Listing interfaces
│   ├── order.ts                      # Order interfaces
│   ├── marketplace.ts                # Marketplace types
│   ├── supplier.ts                   # Supplier types
│   ├── user.ts                       # User/profile types
│   ├── analytics.ts                  # Analytics types
│   └── notifications.ts              # Notification types
│
├── styles/
│   ├── globals.css                   # Tailwind base + theme variables
│   └── colors.ts                     # Design token definitions
│
└── public/
    ├── icons/                        # SVG icons
    ├── marketplace-logos/            # eBay, Amazon, Facebook, Etsy logos
    └── illustrations/                # Empty state illustrations
```

---

## 3. MODAL / DIALOG TREE

```
Modals/Dialogs (all via <Modal> base component)
│
├── 📦 Product Modals
│   ├── ImportPreviewModal            # Before confirming import
│   ├── ProductDeleteConfirm          # Confirm product deletion
│   ├── BulkImportModal              # CSV/paste bulk URLs
│   ├── CategoryAssignModal           # Assign category to product(s)
│   └── ProductMergeModal            # Merge duplicate products
│
├── 📝 Listing Modals
│   ├── AITitleSuggestions            # AI-generated title options
│   ├── AIDescriptionPreview          # AI description diff view
│   ├── KeywordSuggestions            # AI keyword recommendations
│   ├── ListingPreviewModal           # How listing looks on marketplace
│   ├── PublishConfirmModal           # Confirm publish to marketplace
│   ├── BulkPublishModal              # Publish multiple at once
│   └── ExportFormatModal             # Choose CSV/API/direct format
│
├── 💰 Pricing Modals
│   ├── PriceAlertModal               # Price change notification
│   ├── ManualRepriceModal            # Override auto price
│   ├── BulkRepriceModal              # Reprice selected products
│   └── RuleTestModal                 # Test a repricing rule
│
├── 📦 Order Modals
│   ├── OrderDetailModal              # Quick order detail popup
│   ├── CancelOrderConfirm            # Confirm cancellation
│   ├── RefundModal                   # Process refund
│   ├── FulfillmentModal              # Manual fulfillment form
│   ├── TrackingModal                 # Add tracking number
│   └── SupplierOrderConfirm          # Confirm auto-order placement
│
├── 👥 Team Modals
│   ├── InviteUserModal               # Send team invite
│   ├── EditPermissionsModal          # Change user role
│   ├── RemoveTeamMemberConfirm       # Confirm removal
│   └── TeamActivityModal             # View user activity log
│
├── ⚙️ Settings Modals
│   ├── DisconnectMarketplaceConfirm  # Confirm marketplace disconnect
│   ├── RegenerateApiKeyConfirm       # Confirm API key rotation
│   ├── ChangePlanModal               # Upgrade/downgrade plan
│   └── DeleteSupplierConfirm         # Confirm supplier removal
│
├── 👤 Profile Modals
│   ├── ChangeAvatarModal             # Upload/crop avatar
│   ├── Enable2FAModal               # 2FA setup wizard
│   ├── SessionRevokeConfirm          # Confirm session kill
│   └── DeleteAccountConfirm          # Final delete confirmation
│
├── 🔔 Notification Modals
│   ├── NotificationDetailModal       # Expand notification
│   └── MarkAllReadConfirm            # Mark all as read
│
└── 🔧 System Modals
    ├── ErrorDetailModal               # Stack trace / error detail
    ├── LogDetailModal                 # Expanded log entry
    └── OnboardingWizard               # First-time setup walkthrough
```

---

## 4. BUTTON MAP (Every Interactive Element)

```
BUTTON INVENTORY by location:

┌─────────────────────────────────────────────────────────────────────┐
│ TOP NAV BAR                                                        │
│ [☰]          — Toggle sidebar mobile/desktop collapse              │
│ [🕵️ Logo]    — Go to Dashboard                                    │
│ [⌕ Search]   — Open global search overlay                         │
│ [🔔]         — Toggle notification panel                          │
│ [👤 Avatar]  — Open user dropdown menu                             │
│   ├─ View Profile                                                  │
│   ├─ Account Settings                                              │
│   ├─ Billing                                                       │
│   ├─ Keyboard Shortcuts                                            │
│   └─ Sign Out                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SIDEBAR                                                            │
│ Each nav item: [Icon] Label          — Navigate to page             │
│ Section headers    — Expand/collapse section                        │
│ Active indicator   — Highlight current page                         │
│ Collapse toggle [◀] — Collapse/expand sidebar                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ DASHBOARD                                                          │
│ [Import New Product]   — Navigate to /import                       │
│ [View Library]         — Navigate to /library                      │
│ [View Orders]          — Navigate to /orders                       │
│ [Run Price Check]      — Trigger immediate price scan              │
│ [View All] (per widget) — Navigate to relevant section             │
│ Stat cards (clickable)  — Navigate to filtered view                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ IMPORT PAGE                                                        │
│ [Import URL]         — Submit single URL for import                │
│ [+ Bulk Import]      — Open bulk import modal                      │
│ [📋 Paste URLs]      — Text area for multiple URLs                 │
│ [📂 Upload CSV]      — File upload with drag & drop                │
│ [Preview]            — Show import preview before confirming        │
│ [Confirm Import ✓]   — Finalize import                             │
│ [Cancel]             — Discard import                              │
│ [Retry]              — Retry failed import                         │
│ [View in Library]    — Navigate to imported product                │
│ Supplier dropdown    — Select supplier source                      │
│ Category dropdown    — Assign initial category                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PRODUCT LIBRARY                                                    │
│ [View Mode: Grid/List] — Toggle display mode                       │
│ [Filters ▼]           — Open filter panel                          │
│ [Search]              — Search products                            │
│ [Sort By ▼]           — Sort products                              │
│ [Bulk Actions ▼]      — Select multiple product actions            │
│   ├─ Delete Selected                                                │
│   ├─ Export Selected                                                 │
│   ├─ Rewrite Listings                                                │
│   ├─ Add to Category                                                 │
│   └─ Reprice Selected                                                │
│ Per product row:                                                    │
│   [Edit ✏️]          — Edit product                                │
│   [Rewrite 📝]        — Go to rewrite page                         │
│   [Duplicate]         — Duplicate product                          │
│   [Delete 🗑️]        — Delete with confirm                        │
│   [Checkbox]          — Select for bulk actions                    │
│ [Load More / Pagination] — Next/prev page                          │
│ [Export CSV]          — Download library as CSV                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LISTING REWRITE PAGE                                               │
│ [✨ Auto-Rewrite]    — Generate AI rewrite                         │
│ [↻ Generate Again]   — Regenerate with new params                  │
│ [Style: Premium/Budget/Emotional] — Toggle writing style           │
│ [🌐 Language ▼]      — Select target language                     │
│ [📸 Optimize Images] — Auto-process images                        │
│ [🔑 Generate Keywords] — AI keyword suggestions                    │
│ [A/B Test]           — Create version A vs B                       │
│ [📋 Copy Title]      — Copy to clipboard                           │
│ [📋 Copy Description] — Copy to clipboard                          │
│ [Save Draft]         — Save as draft                               │
│ [Export to... ▼]     — Open export flow                            │
│   ├─ eBay                                                           │
│   ├─ Amazon                                                         │
│   ├─ Facebook                                                       │
│   ├─ Etsy                                                           │
│   ├─ Shopify                                                        │
│   └─ CSV Download                                                   │
│ [Preview on Marketplace] — Show marketplace preview                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ PRICE TRACKING PAGE                                                │
│ [Run Check Now]      — Trigger immediate price scan                │
│ [Auto-Reprice Toggle] — Enable/disable auto-repricing              │
│ [+ New Rule]         — Create repricing rule                       │
│ [Edit Rule ✏️]       — Edit existing rule                          │
│ [Delete Rule 🗑️]     — Delete rule                                │
│ [Toggle Rule On/Off] — Enable/disable individual rule              │
│ [Simulate Price]     — Open price simulator                         │
│ [View History]       — Open price history chart                    │
│ [Ignore Product]     — Exclude from tracking                       │
│ [Export Price Data]  — Download price history CSV                  │
│ Per product:                                                       │
│   [Override Price]   — Set manual price override                   │
│   [View Chart]       — Show individual price chart                 │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ORDERS PAGE                                                        │
│ [Filters ▼]          — Filter by status, marketplace, date         │
│ [Search]             — Search orders                               │
│ [Export Orders]      — Download order CSV                          │
│ Per order row:                                                      │
│   [View Details]     — Open order detail                           │
│   [Fulfill ✓]        — Mark as fulfilled / auto-order              │
│   [Cancel ✕]         — Cancel order                                │
│   [Refund ↩]         — Process refund                             │
│   [Add Tracking]     — Add tracking number                         │
│   [Contact Buyer]    — Send message (future)                       │
│ [Bulk Fulfill]       — Fulfill multiple selected                   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ANALYTICS PAGE                                                     │
│ [Date Range: ▼]      — Select time period                          │
│ [Export Report]      — Download PDF/CSV report                     │
│ [+ Save Report]      — Save current view as report                 │
│ [Share Report]        — Generate shareable link                    │
│ [Compare Period]     — Toggle period comparison                    │
│ [View by: ▼]         — Group by day/week/month                     │
│ Chart interactions:  — Hover for tooltip, click legend to toggle   │
│ Metric cards:        — Click to drill down                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ ACCOUNT HEALTH PAGE                                                │
│ [Refresh Score]      — Trigger health recalculation                │
│ [View Details ▼]     — Expand per-marketplace details              │
│ [Dismiss Alert]      — Dismiss risk warning                        │
│ [View Suggestions]   — Show AI improvement tips                    │
│ [Fix Issue →]        — Navigate to fix action                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ SETTINGS PAGE                                                      │
│ [Save Changes]       — Save settings form                          │
│ [Reset to Default]   — Reset section to defaults                   │
│ [+ Connect Marketplace] — Start OAuth flow                         │
│ [Disconnect 🔗]      — Disconnect marketplace                      │
│ [Re-authorize]       — Refresh expired credentials                 │
│ [+ Add Supplier]     — Add custom supplier                         │
│ [Test Supplier]      — Test supplier connection                    │
│ [+ Invite Member]    — Open invite modal                           │
│ [Remove Member]      — Remove team member                          │
│ [Change Role ▼]      — Change user permission level                │
│ [+ Generate API Key] — Create new API key                          │
│ [Revoke API Key]     — Delete API key                              │
│ [Upgrade Plan]       — Open billing/plan change                    │
│ [Cancel Subscription] — Cancel plan                                │
│ [Download Invoice]   — Download PDF invoice                        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┘
│ PROFILE PAGE                                                       │
│ [Save Profile]       — Save profile changes                        │
│ [Change Avatar]      — Upload new avatar (opens modal)             │
│ [Remove Avatar]      — Reset to default                            │
│ [Change Password]    — Update password                             │
│ [Enable 2FA]         — Enable two-factor auth (wizard)             │
│ [Disable 2FA]        — Disable two-factor auth                     │
│ [Revoke Session]     — Kill specific login session                 │
│ [Revoke All Sessions] — Log out everywhere                         │
│ [Delete Account]     — Initiate account deletion (danger zone)     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ LOGS PAGE                                                          │
│ [Filters ▼]          — Filter by type, date, service, severity     │
│ [Search]             — Search log entries                          │
│ [Refresh]            — Reload log data                             │
│ [Auto-Refresh Toggle] — Live tail logs                             │
│ [Export Logs]        — Download log file                           │
│ Per log entry:                                                      │
│   [Expand ▼]         — Show full details                          │
│   [Copy Message]     — Copy log message                            │
│ [Clear Filters]      — Reset all filters                           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. RESPONSIVE BREAKDOWN

```
┌─────────────────────────────────────────────────────────────────────┐
│ DESKTOP (≥1024px)                                                  │
│ ┌─────────────┐ ┌─────────────────────────────────────────────┐   │
│ │ Sidebar     │ │ Top Nav                                      │   │
│ │ (260px)     │ │──────────────────────────────────────────────│   │
│ │             │ │                                              │   │
│ │ Nav items   │ │ Main Content                                 │   │
│ │ expanded    │ │ Full pages with side panels                  │   │
│ │ with labels │ │ Data tables with all columns                 │   │
│ └─────────────┘ │ Multi-column layouts                         │   │
│                 └──────────────────────────────────────────────┘   │
│                                                                     │
│ TABLET (768-1023px)                                                │
│ ┌──────┐ ┌────────────────────────────────────────────────────┐   │
│ │ Mini │ │ Top Nav                                             │   │
│ │Side  │ │─────────────────────────────────────────────────────│   │
│ │(icon │ │                                                     │   │
│ │ only)│ │ Main Content                                        │   │
│ │      │ │ Condensed tables, stacked cards                     │   │
│ │      │ │ Single column layouts                               │   │
│ └──────┘ └─────────────────────────────────────────────────────┘   │
│                                                                     │
│ MOBILE (<768px)                                                    │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Top Nav (simplified) — Logo + Search + Notif + Avatar        │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │                                                              │   │
│ │ Main Content (full width, stacked)                           │   │
│ │                                                              │   │
│ │ - All tables become card lists                               │   │
│ │ - Side panels become full-screen overlays                    │   │
│ │ - Modals become bottom sheets                                │   │
│ │ - Filters become collapsible sections                        │   │
│ │                                                              │   │
│ ├──────────────────────────────────────────────────────────────┤   │
│ │ Bottom Nav Bar                                               │   │
│ │ [🏠] [📦] [📝] [📊] [⚙️]                                     │   │
│ │ Home Library Listings Analytics More                         │   │
│ └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. DESIGN SYSTEM TOKENS

```
Colors:
├── Primary:     Indigo-600 (#4F46E5)    — Actions, links, active states
├── Primary-hover: Indigo-700 (#4338CA)
├── Success:     Emerald-500 (#10B981)   — Active listings, profit, fulfilled
├── Warning:     Amber-500 (#F59E0B)     — Price changes, near limits
├── Danger:      Red-500 (#EF4444)       — Errors, bans, high risk
├── Info:        Sky-500 (#0EA5E9)       — System notifications
├── Neutral:     Slate scale             — Backgrounds, borders, text
├── Surface:     White / Slate-50        — Cards, modals
├── Sidebar-bg:  Slate-900 (#0F172A)     — Dark sidebar
└── Sidebar-text: Slate-100 (#F1F5F9)

Typography:
├── Font:        Inter (sans-serif)
├── Headings:    Font-semibold, -bold (Tailwind)
├── Body:        Font-normal, text-sm (14px)
├── Labels:      Font-medium, text-xs (12px)
└── Monospace:   JetBrains Mono (for logs, API keys)

Spacing:
├── Sidebar:     260px (expanded), 64px (collapsed)
├── Page max:    1440px
├── Card gap:    24px
├── Padding:     24px (page), 16px (card)
└── Border radius: 8px (cards), 6px (buttons), 4px (inputs)

Shadows:
├── Card:        shadow-sm
├── Modal:       shadow-xl
├── Dropdown:    shadow-lg
└── Top nav:     shadow (bottom border)
