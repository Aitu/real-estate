import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { SWRConfig } from 'swr';
import { ReactNode } from 'react';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SessionProviders } from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: {
    default: 'LuxNest — Luxembourg Real Estate Listings',
    template: '%s · LuxNest'
  },
  description:
    'Discover, compare, and manage real estate opportunities across Luxembourg with localized search and interactive maps.'
};

export const viewport: Viewport = {
  maximumScale: 1,
  themeColor: '#0f172a'
};

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`bg-white text-slate-900 antialiased ${manrope.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] bg-neutral-50">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          <SessionProviders>{children}</SessionProviders>
        </SWRConfig>
      </body>
    </html>
  );
}
