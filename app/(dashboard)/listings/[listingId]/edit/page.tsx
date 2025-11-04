import { notFound, redirect } from 'next/navigation';
import { ListingWizard } from '@/components/listings/listing-wizard';
import { getUser } from '@/lib/db/queries';
import { getListingDetail } from '@/lib/db/listings';
import type { ListingEditorValues } from '@/lib/validation/listing';

function mapDetailToEditorValues(detail: Awaited<ReturnType<typeof getListingDetail>>): ListingEditorValues {
  if (!detail) {
    throw new Error('Listing detail is required');
  }

  return {
    title: detail.title ?? '',
    slug: detail.slug ?? '',
    description: detail.description ?? '',
    propertyType: detail.propertyType,
    transactionType: detail.transactionType,
    street: detail.location.street ?? '',
    city: detail.location.city ?? '',
    postalCode: detail.location.postalCode ?? '',
    country: detail.location.country ?? 'LU',
    bedrooms: detail.bedrooms,
    bathrooms: detail.bathrooms,
    parkingSpaces: detail.parkingSpaces,
    area: detail.area,
    lotArea: detail.lotArea,
    yearBuilt: detail.yearBuilt,
    energyClass: detail.energyClass,
    floor: detail.floor,
    totalFloors: detail.totalFloors,
    latitude: detail.location.coordinates.lat,
    longitude: detail.location.coordinates.lng,
    price: detail.price,
    currency: detail.currency ?? 'EUR',
  };
}

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  const id = Number(listingId);
  if (!listingId || Number.isNaN(id)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/dashboard/listings/${id}/edit`);
  }

  const listing = await getListingDetail(id);
  if (!listing) {
    notFound();
  }

  if (listing.owner.id !== user.id) {
    redirect('/dashboard');
  }

  const initialValues = mapDetailToEditorValues(listing);

  return (
    <main className="px-4 pb-16 pt-10 sm:px-6 lg:px-12">
      <ListingWizard
        mode="edit"
        initialListingId={listing.id}
        initialStatus={listing.status === 'published' ? 'published' : 'draft'}
        initialValues={initialValues}
        initialImages={listing.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          isPrimary: image.isPrimary,
          displayOrder: image.displayOrder,
        }))}
      />
    </main>
  );
}
