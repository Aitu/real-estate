import { and, eq, gt, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { listings, listingImages, propertyFeatures } from '@/lib/db/schema';
import { mockListings } from '@/lib/mock/listings';
import type { ListingSummary } from '@/lib/types/listing';

type ListingSummaryRecord = typeof listings.$inferSelect & {
  images: Array<
    Pick<
      typeof listingImages.$inferSelect,
      'id' | 'url' | 'alt' | 'isPrimary' | 'displayOrder'
    >
  >;
  features: Array<
    Pick<typeof propertyFeatures.$inferSelect, 'id' | 'label' | 'value'>
  >;
};

function toListingSummary(record: ListingSummaryRecord): ListingSummary {
  const images = record.images
    .slice()
    .sort((a, b) => {
      const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }

      return a.id - b.id;
    });

  const primaryImage =
    images.find((image) => image.isPrimary)?.url ??
    images[0]?.url ??
    'https://images.unsplash.com/photo-1600585154340-0ef3c08ba9f9?auto=format&fit=crop&w=1280&q=80';

  const highlights = record.features
    .map((feature) => feature.label || feature.value)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);

  return {
    id: String(record.id),
    title: record.title,
    category: (record.propertyType as ListingSummary['category']) || 'apartment',
    price: record.price,
    priceType: record.transactionType === 'rent' ? 'rent' : 'sale',
    currency: 'EUR',
    bedrooms: record.bedrooms ?? 0,
    bathrooms: record.bathrooms ?? 0,
    areaSqm: record.area ?? 0,
    mainImage: primaryImage,
    gallery: images.map((image) => ({
      id: String(image.id),
      url: image.url,
      alt: image.alt,
      isMain: image.isPrimary ?? undefined,
      displayOrder: image.displayOrder ?? undefined,
    })),
    location: {
      address: record.street ?? '',
      city: record.city,
      postalCode: record.postalCode,
      country: record.country === 'LU' ? 'Luxembourg' : record.country,
      coordinates: {
        lat: record.latitude ?? 0,
        lng: record.longitude ?? 0,
      },
    },
    highlights,
  };
}

async function getPublishedListingSummaries(limit = mockListings.length): Promise<ListingSummary[]> {
  const records = await db.query.listings.findMany({
    where: and(
      eq(listings.status, 'published'),
      isNotNull(listings.expiresAt),
      gt(listings.expiresAt, new Date())
    ),
    orderBy: (fields, operators) => [
      operators.desc(fields.publishedAt),
      operators.desc(fields.createdAt),
    ],
    limit,
    columns: {
      id: true,
      title: true,
      propertyType: true,
      transactionType: true,
      price: true,
      currency: true,
      bedrooms: true,
      bathrooms: true,
      area: true,
      street: true,
      city: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
    },
    with: {
      images: {
        columns: {
          id: true,
          url: true,
          alt: true,
          isPrimary: true,
          displayOrder: true,
        },
      },
      features: {
        columns: {
          id: true,
          label: true,
          value: true,
        },
        limit: 3,
      },
    },
  });

  return records.map((record) => toListingSummary(record as ListingSummaryRecord));
}

export async function getFeaturedListings(): Promise<ListingSummary[]> {
  const liveListings = await getPublishedListingSummaries();
  const existingIds = new Set(liveListings.map((listing) => listing.id));
  const fallback = mockListings.filter((listing) => !existingIds.has(listing.id));

  return [...liveListings, ...fallback];
}
