import { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';

export default function MarketingLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
