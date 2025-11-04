import { redirect } from 'next/navigation';
import { ListingWizard } from '@/components/listings/listing-wizard';
import { getUser } from '@/lib/db/queries';

export default async function NewListingPage() {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in?redirect=/dashboard/listings/new');
  }

  return (
    <main className="px-4 pb-16 pt-10 sm:px-6 lg:px-12">
      <ListingWizard mode="create" initialStatus="draft" />
    </main>
  );
}
