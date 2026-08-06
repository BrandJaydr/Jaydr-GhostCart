// TODO: @agent:forge (Stage 2) Add breadcrumb support
// TODO: @agent:forge (Stage 2) Add slot for primary action button (top-right)
// Reference: Blueprint §5.3 — "Design for dense, operational work: clear status, timestamps, source attribution"

export interface PageHeaderProps {
  /** Main page title (rendered as h1 — one per page) */
  title: string;
  /** Optional subtitle or context string */
  subtitle?: string;
  /** Optional action element (e.g. a <Button>) placed at top-right */
  action?: React.ReactNode;
}

/**
 * PageHeader — Stage 1 Stub
 * Standard header for every main content page.
 * Renders one <h1> per page — ensures correct heading hierarchy.
 */
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}
