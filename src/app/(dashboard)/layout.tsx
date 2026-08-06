/**
 * Authenticated Dashboard Layout — Stage 1 Stub
 *
 * All merchant-facing screens (import, product review, listing draft) live here.
 * This layout is responsible for:
 *   1. Session validation — unauthenticated users → /sign-in
 *   2. Tenant ID propagation — inject tenant context into server component tree
 *   3. App shell chrome — navigation sidebar + page frame
 *
 * TODO: @agent:forge Implement getServerSession() check → redirect if no session
 * TODO: @agent:forge Add <AppShell> / <Sidebar> navigation component
 * TODO: @agent:forge Propagate tenantId from session into layout context
 *
 * Blueprint reference: Stage 1 — "tenant-scoped tables, roles, audit events"
 */
export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div>
      {/* TODO: @agent:forge Replace with <AppShell> — sidebar + topbar + content area */}
      <nav aria-label="Main navigation">
        <p style={{ color: 'gray' }}>[Navigation placeholder — Stage 1 scaffold]</p>
      </nav>
      <main>{children}</main>
    </div>
  );
}
