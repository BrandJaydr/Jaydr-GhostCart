import type { Metadata } from 'next';

// @agent:scribe Update metadata when brand tokens and SEO strategy are confirmed (Stage 3+)
export const metadata: Metadata = {
  title: {
    default: 'GhostCart',
    template: '%s | GhostCart',
  },
  description: 'Enterprise Reseller & Dropshipping Automation Platform',
  robots: {
    index: false, // Keep private during pilot — @agent:scribe flip to true post-launch
  },
};

/**
 * Root layout — wraps every page.
 *
 * TODO: @agent:forge (Stage 2) Add font import (e.g. Inter from next/font/google)
 * TODO: @agent:forge (Stage 2) Add ThemeProvider / design system tokens
 * TODO: @agent:forge (Stage 2) Add global toast/notification container
 */
export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* TODO: @agent:forge Add AuthSessionProvider wrapping children */}
        {children}
      </body>
    </html>
  );
}
