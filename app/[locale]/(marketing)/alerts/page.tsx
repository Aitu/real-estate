import { notFound, redirect } from 'next/navigation';

import { AlertsClient } from './alerts-client';
import { getAlertsForUser } from '@/lib/db/alerts';
import { getUser } from '@/lib/db/queries';
import { isLocale } from '@/lib/i18n/config';

export default async function AlertsPage({
  params
}: {
  params: { locale: string };
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/${locale}/alerts`);
  }

  const alerts = await getAlertsForUser(user.id);

  return <AlertsClient locale={locale} alerts={alerts} />;
}
