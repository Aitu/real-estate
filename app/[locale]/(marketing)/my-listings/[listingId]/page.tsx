import { notFound, redirect } from 'next/navigation';

import { ListingWizard } from '@/components/listings/listing-wizard';
import { getListingDetail } from '@/lib/db/listings';
import { getUser } from '@/lib/db/queries';
import { getListingPlansFromStripe } from '@/lib/listings/plans';
import type { ListingEditorValues } from '@/lib/validation/listing';
import { isLocale } from '@/lib/i18n/config';

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
    contactEmail: detail.contactEmail ?? '',
    contactPhone: detail.contactPhone ?? '',
    displayEmail: detail.displayEmail ?? true,
    displayPhone: detail.displayPhone ?? true,
    promotionTier: detail.promotionTier ?? 'standard',
    priceId: '',
    durationMultiplier: 1,
  };
}

export default async function EditListingPage({
  params,
}: {
  params: { locale: string; listingId: string };
}) {
  const { locale, listingId } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const id = Number(listingId);
  if (!listingId || Number.isNaN(id)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/${locale}/my-listings/${id}`);
  }

  const listing = await getListingDetail(id);
  if (!listing) {
    notFound();
  }

  if (listing.owner.id !== user.id) {
    redirect(`/${locale}/my-listings`);
  }

  const plans = await getListingPlansFromStripe().catch((error) => {
    console.error('Failed to load listing plans from Stripe', error);
    return [];
  });

  const initialValues = mapDetailToEditorValues(listing);

  return (
    <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <ListingWizard
        locale={locale}
        plans={plans}
        mode="edit"
        initialListingId={listing.id}
        initialStatus={listing.status === 'published' ? 'published' : 'draft'}
        initialPaymentStatus={listing.paymentStatus === 'paid' ? 'paid' : 'unpaid'}
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
