'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import {
  BadgeDollarSign,
  Building2,
  Home,
  Key,
  Menu,
  UserRound,
  X
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTranslations, useI18n } from '@/lib/i18n/provider';
import { useCurrentUser } from '@/hooks/use-current-user';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageSwitcher } from '@/components/layout/language-switcher';

const NAV_ITEMS = [
  { key: 'buy', icon: Home, anchor: '#buy' },
  { key: 'rent', icon: Key, anchor: '#rent' },
  { key: 'sell', icon: BadgeDollarSign, anchor: '#sell' }
] as const;

export function SiteHeader() {
  const tNav = useTranslations('navigation');
  const { locale } = useI18n();
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name && !user?.email) {
      return 'U';
    }

    const source = user?.name || user?.email || 'U';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  const loginPath = `/${locale}/login`;
  const signupPath = `/${locale}/signup`;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">LuxNest</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {NAV_ITEMS.map(({ key, icon: Icon, anchor }) => {
            const href = `/${locale}${anchor}`;
            const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
            const active = isHome;
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  'group flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white',
                  active && 'border-slate-900/20 text-slate-900 dark:border-slate-500 dark:text-white'
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/5 text-slate-700 transition group-hover:bg-slate-900/10 dark:bg-slate-100/10 dark:text-slate-200 dark:group-hover:bg-slate-100/20">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="tracking-wide">{tNav(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          {!user && (
            <Link href={loginPath} aria-label={tNav('login')}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserRound className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
          {user ? (
            <UserDropdown initials={initials} locale={locale} />
          ) : (
            <>
              <Link
                href={loginPath}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {tNav('login')}
              </Link>
              <Link href={signupPath}>
                <Button size="sm" className="rounded-full px-4 text-sm">
                  {tNav('signup')}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 md:hidden">
          <nav className="flex flex-col gap-3 px-4 py-4">
            {NAV_ITEMS.map(({ key, icon: Icon, anchor }) => (
              <Link
                key={key}
                href={`/${locale}${anchor}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/70 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-900"
                onClick={() => setMenuOpen(false)}
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900/5 text-slate-700 dark:bg-slate-100/10 dark:text-slate-100">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{tNav(key)}</span>
              </Link>
            ))}
            <div className="flex items-center justify-between px-3">
              <Suspense fallback={null}>
                <LanguageSwitcher />
              </Suspense>
              <ThemeToggle />
              {!user && (
                <>
                  <Link
                    href={loginPath}
                    className="text-sm font-medium text-slate-600 dark:text-slate-300"
                    onClick={() => setMenuOpen(false)}
                  >
                    {tNav('login')}
                  </Link>
                  <Link href={signupPath} onClick={() => setMenuOpen(false)}>
                    <Button size="sm" className="rounded-full px-4 text-sm">
                      {tNav('signup')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-3 px-3 pt-2">
              {user ? (
                <UserDropdown initials={initials} inline locale={locale} />
              ) : null}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function UserDropdown({
  initials,
  inline = false,
  locale
}: {
  initials: string;
  inline?: boolean;
  locale: string;
}) {
  const tNav = useTranslations('navigation');

  const trigger = (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size={inline ? 'sm' : 'icon'}
        className={cn(
          'relative rounded-full border border-slate-200 px-2 text-slate-600 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200 dark:hover:text-white',
          inline && 'pl-2 pr-3'
        )}
      >
        <Avatar className="h-8 w-8 border border-slate-200 dark:border-slate-600">
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {inline && (
          <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            {tNav('favorites')}
          </span>
        )}
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent className="w-52" align="end">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/favorites`}>{tNav('favorites')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/my-listings`}>{tNav('myListings')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/${locale}/alerts`}>{tNav('alerts')}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-600">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: `/${locale}` })}
            className="w-full text-left"
          >
            {tNav('logout')}
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
