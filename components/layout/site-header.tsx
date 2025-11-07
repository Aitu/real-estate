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
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 items-center gap-6">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 text-sm font-semibold text-slate-900 transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:text-slate-100"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-slate-900 text-white shadow-sm dark:border-slate-700 dark:bg-slate-100 dark:text-slate-900">
              <Building2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden text-lg tracking-tight sm:inline">LuxNest</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ key, anchor }) => {
              const href = `/${locale}${anchor}`;
              const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
              const active = isHome && key === 'buy';
              return (
                <Link
                  key={key}
                  href={href}
                  className={cn(
                    'group relative inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold tracking-tight text-slate-500 transition duration-200 ease-out hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:text-slate-300 dark:hover:text-white',
                    'after:absolute after:bottom-0 after:left-3 after:right-3 after:h-[1.5px] after:origin-center after:scale-x-0 after:bg-slate-900/70 after:opacity-0 after:transition-all after:duration-300 after:ease-out group-hover:after:scale-x-100 group-hover:after:opacity-100 dark:after:bg-slate-100/70',
                    active && 'text-slate-900 after:scale-x-100 after:opacity-100 dark:text-white'
                  )}
                >
                  {tNav(key)}
                </Link>
              );
            })}
          </nav>
        </div>

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

        <div className="hidden items-center gap-4 md:flex">
          <span
            aria-hidden="true"
            className="hidden h-6 w-px bg-slate-200/70 dark:bg-slate-800 lg:inline-block"
          />
          <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40">
            <Suspense fallback={null}>
              <LanguageSwitcher />
            </Suspense>
            <span
              aria-hidden="true"
              className="h-4 w-px bg-slate-200/70 dark:bg-slate-700/70"
            />
            <ThemeToggle />
          </div>
          <span
            aria-hidden="true"
            className="h-6 w-px bg-slate-200/70 dark:bg-slate-800/70"
          />
          {user ? (
            <UserDropdown initials={initials} locale={locale} />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href={loginPath}
                className="text-sm font-semibold text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                {tNav('login')}
              </Link>
              <span
                aria-hidden="true"
                className="h-5 w-px bg-slate-200/70 dark:bg-slate-800/70"
              />
              <Link href={signupPath}>
                <Button size="sm" className="rounded-full px-4 text-sm font-semibold">
                  {tNav('signup')}
                </Button>
              </Link>
            </div>
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
