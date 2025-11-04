import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { defaultLocale } from '@/lib/i18n/config';

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

  return <div className="flex min-h-[100dvh] flex-col">{children}</div>;
}
