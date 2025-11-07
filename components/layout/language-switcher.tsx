'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { locales, type Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  fr: 'FR',
  de: 'DE'
};

function getCurrentLocale(pathname: string | null): Locale {
  if (!pathname) {
    return 'en';
  }

  const segments = pathname.split('/').filter(Boolean);
  const candidate = segments[0];
  if (locales.includes(candidate as Locale)) {
    return candidate as Locale;
  }

  return 'en';
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentLocale = getCurrentLocale(pathname);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) {
      return;
    }

    startTransition(() => {
      const segments = pathname ? pathname.split('/') : [''];
      if (segments.length === 0) {
        segments.push('');
      }

      // ensure first element is blank from leading slash
      const normalized = [...segments];
      if (normalized[0] !== '') {
        normalized.unshift('');
      }

      if (normalized.length > 1) {
        normalized[1] = nextLocale;
      } else {
        normalized.push(nextLocale);
      }

      const nextPath = normalized.join('/') || `/${nextLocale}`;
      const query = searchParams?.toString();
      router.push(query ? `${nextPath}?${query}` : nextPath);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'group inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:text-slate-200 dark:hover:bg-slate-100/10 dark:hover:text-white',
            isPending && 'opacity-60'
          )}
        >
          <span>{LOCALE_LABELS[currentLocale]}</span>
          <ChevronDown className="h-3 w-3 transition group-hover:translate-y-0.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-24">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            className={cn(
              'cursor-pointer justify-between text-sm font-medium uppercase text-slate-600 dark:text-slate-200',
              locale === currentLocale && 'text-orange-600 dark:text-orange-400'
            )}
            onSelect={(event) => {
              event.preventDefault();
              handleSelect(locale);
            }}
          >
            {LOCALE_LABELS[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
