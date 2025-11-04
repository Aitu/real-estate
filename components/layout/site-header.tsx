'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  BadgeEuro,
  Building2,
  Heart,
  Menu,
  Sparkles,
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

const NAV_ITEMS = [
  { key: 'buy', icon: Building2, href: '#listings' },
  { key: 'rent', icon: Heart, href: '#listings' },
  { key: 'new', icon: Sparkles, href: '#listings' },
  { key: 'sell', icon: BadgeEuro, href: '#listings' }
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

  const authLinks = (
    <div className="hidden items-center gap-2 md:flex">
      <Link href={loginPath} className="text-sm font-medium text-slate-600">
        {tNav('login')}
      </Link>
      <Link href={signupPath}>
        <Button size="sm" className="rounded-full px-4 text-sm">
          {tNav('signup')}
        </Button>
      </Link>
    </div>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 text-sm font-semibold text-slate-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-white">
            <Building2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden text-lg tracking-tight sm:inline">LuxNest</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map(({ key, icon: Icon, href }) => {
            const active = pathname.includes(href.replace('#', ''));
            return (
              <Link
                key={key}
                href={href}
                className={cn(
                  'group flex flex-col items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-slate-900',
                  active && 'text-slate-900'
                )}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition group-hover:border-slate-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="tracking-wide">{tNav(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
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

        {user ? (
          <UserDropdown initials={initials} locale={locale} />
        ) : (
          authLinks
        )}
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-sm md:hidden">
          <nav className="flex flex-col gap-2 px-4 py-4">
            {NAV_ITEMS.map(({ key, icon: Icon, href }) => (
              <Link
                key={key}
                href={href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                onClick={() => setMenuOpen(false)}
              >
                <span className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{tNav(key)}</span>
              </Link>
            ))}
            <div className="flex items-center gap-3 px-3 pt-2">
              {user ? (
                <UserDropdown initials={initials} inline locale={locale} />
              ) : (
                <>
                  <Link href={loginPath} className="text-sm font-medium text-slate-600">
                    {tNav('login')}
                  </Link>
                  <Link href={signupPath} className="ml-auto">
                    <Button size="sm" className="rounded-full px-4 text-sm">
                      {tNav('signup')}
                    </Button>
                  </Link>
                </>
              )}
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
        className={cn('rounded-full border border-slate-200 px-2', inline && 'pl-2 pr-3')}
      >
        <Avatar className="h-8 w-8 border border-slate-200">
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {inline && <span className="ml-2 text-sm font-medium text-slate-700">{tNav('favorites')}</span>}
      </Button>
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {trigger}
        <DropdownMenuContent className="w-48" align="end">
          <DropdownMenuLabel>{tNav('favorites')}</DropdownMenuLabel>
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
