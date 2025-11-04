import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { defaultLocale, isLocale } from '@/lib/i18n/config';
import { DashboardClientLayout } from './client-layout';

export default async function Layout({
  children
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    const locale = defaultLocale;
    const callback = encodeURIComponent('/dashboard');
    redirect(`/${locale}/login?callbackUrl=${callback}`);
  }

  const userLocale =
    typeof session.user.locale === 'string' &&
    isLocale(session.user.locale)
      ? session.user.locale
      : defaultLocale;

  return <DashboardClientLayout locale={userLocale}>{children}</DashboardClientLayout>;
}
