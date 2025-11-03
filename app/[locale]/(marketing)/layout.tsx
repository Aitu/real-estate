import { ReactNode } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';

export default function MarketingLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SiteHeader />
      <main className="flex-1 bg-neutral-50">{children}</main>
      <SiteFooter />
    </div>
  );
}
