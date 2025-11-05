import { and, desc, eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
  favorites,
  listings,
  listingImages,
  propertyFeatures
} from './schema';
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
    images.find((image) => image.isPrimary)?.url ?? images[0]?.url ??
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

async function getListingSummaryById(
  listingId: number
): Promise<ListingSummary | null> {
  const listingRecord = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
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

  if (!listingRecord) {
    return null;
  }

  return toListingSummary(listingRecord as ListingSummaryRecord);
}

export async function getFavoriteListingSummaries(
  userId: number
): Promise<ListingSummary[]> {
  const favoriteRecords = await db.query.favorites.findMany({
    where: eq(favorites.userId, userId),
    orderBy: (fields) => [desc(fields.createdAt)],
    with: {
      listing: {
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
      },
    },
  });

  return favoriteRecords
    .map((favorite) => favorite.listing)
    .filter((listing): listing is ListingSummaryRecord => Boolean(listing))
    .map((listing) => toListingSummary(listing));
}

export async function addFavorite(
  userId: number,
  listingId: number
): Promise<ListingSummary | null> {
  await db
    .insert(favorites)
    .values({ userId, listingId })
    .onConflictDoNothing({
      target: [favorites.userId, favorites.listingId],
    });

  return await getListingSummaryById(listingId);
}

export async function removeFavorite(userId: number, listingId: number) {
  await db
    .delete(favorites)
    .where(
      and(eq(favorites.userId, userId), eq(favorites.listingId, listingId))
    );
}
