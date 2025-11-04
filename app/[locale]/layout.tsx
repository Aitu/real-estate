import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { I18nProvider } from '@/lib/i18n/provider';
import { loadMessages } from '@/lib/i18n/get-messages';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';
import { SiteHeader } from '@/components/layout/site-header';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;

  if (!isLocale(requestedLocale)) {
    notFound();
  }

  const messages = await loadMessages(requestedLocale);
  const headerList = await headers();
  const currentUrl = headerList.get('next-url') ?? '/';

  const AUTH_SEGMENTS = ['login', 'signup', 'forgot-password', 'reset-password'];
  const hideShell =
    AUTH_SEGMENTS.some((segment) => currentUrl.endsWith(`/${segment}`)) ||
    currentUrl.endsWith('/not-found');

  const pageContent: ReactNode = hideShell ? (
    children
  ) : (
    <div className="flex min-h-[100dvh] flex-col bg-neutral-50 dark:bg-slate-950">
      <SiteHeader />
      <div className="flex-1">{children}</div>
    </div>
  );

  return (
    <I18nProvider locale={requestedLocale as Locale} messages={messages}>
      {pageContent}
    </I18nProvider>
  );
}
