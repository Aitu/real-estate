'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/provider';

export function SiteFooter() {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl text-sm text-slate-600">
            {t('tagline')}
          </div>
          <div className="flex gap-4 text-sm text-slate-500">
            <Link href="/listings" className="hover:text-slate-900">
              Listings
            </Link>
            <Link href="#search" className="hover:text-slate-900">
              Search
            </Link>
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Developed with &hearts; in Luxembourg.
          <br />
          {t('legal', { values: { year: currentYear } })}
        </p>
      </div>
    </footer>
  );
}
