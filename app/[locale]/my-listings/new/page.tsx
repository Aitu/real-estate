import { notFound, redirect } from 'next/navigation';

import { ListingWizard } from '@/components/listings/listing-wizard';
import { getUser } from '@/lib/db/queries';
import { isLocale } from '@/lib/i18n/config';

export default async function NewListingPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/${locale}/my-listings/new`);
  }

  return (
    <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <ListingWizard locale={locale} mode="create" initialStatus="draft" />
    </main>
  );
}
