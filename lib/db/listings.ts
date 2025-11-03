import { asc, eq } from 'drizzle-orm';
import { db } from './drizzle';
import { listings } from './schema';
import type { ListingDetail } from '@/lib/types/listing';
import type {
  Listing as ListingRow,
  ListingImage as ListingImageRow,
  PropertyFeature as PropertyFeatureRow,
  User,
} from './schema';

type ListingWithRelations = ListingRow & {
  owner: Pick<User, 'id' | 'name' | 'email' | 'phoneNumber' | 'avatarUrl' | 'locale'> | null;
  images: Array<
    Pick<ListingImageRow, 'id' | 'url' | 'alt' | 'isPrimary' | 'displayOrder'>
  >;
  features: Array<Pick<PropertyFeatureRow, 'id' | 'label' | 'value' | 'icon'>>;
};

function toIsoString(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function mapListingRecord(record: ListingWithRelations): ListingDetail {
  const owner = record.owner;
  if (!owner) {
    throw new Error('Listing is missing owner reference');
  }

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description,
    propertyType: record.propertyType,
    transactionType: record.transactionType as 'sale' | 'rent',
    status: record.status,
    price: record.price,
    currency: record.currency,
    bedrooms: record.bedrooms,
    bathrooms: record.bathrooms,
    parkingSpaces: record.parkingSpaces,
    area: record.area,
    lotArea: record.lotArea,
    yearBuilt: record.yearBuilt,
    energyClass: record.energyClass,
    floor: record.floor,
    totalFloors: record.totalFloors,
    location: {
      street: record.street,
      city: record.city,
      postalCode: record.postalCode,
      country: record.country,
      coordinates: {
        lat: record.latitude,
        lng: record.longitude,
      },
    },
    images: record.images
      .slice()
      .sort((a, b) => {
        const orderDiff = (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }
        return a.id - b.id;
      })
      .map((image) => ({
        id: image.id,
        url: image.url,
        alt: image.alt,
        isPrimary: image.isPrimary,
        displayOrder: image.displayOrder ?? 0,
      })),
    features: record.features.map((feature) => ({
      id: feature.id.toString(),
      label: feature.label,
      value: feature.value,
      icon: feature.icon,
    })),
    owner: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      phoneNumber: owner.phoneNumber,
      avatarUrl: owner.avatarUrl,
      locale: owner.locale,
    },
    publishedAt: toIsoString(record.publishedAt),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getListingDetail(
  listingId: number
): Promise<ListingDetail | null> {
  if (!Number.isFinite(listingId)) {
    throw new Error('Listing id must be a number');
  }

  const record = (await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          locale: true,
        },
      },
      images: {
        columns: {
          id: true,
          url: true,
          alt: true,
          isPrimary: true,
          displayOrder: true,
        },
        orderBy: (fields) => [asc(fields.displayOrder), asc(fields.id)],
      },
      features: {
        columns: {
          id: true,
          label: true,
          value: true,
          icon: true,
        },
        orderBy: (fields) => [asc(fields.label)],
      },
    },
  })) as ListingWithRelations | undefined;

  if (!record) {
    return null;
  }

  return mapListingRecord(record as ListingWithRelations);
}

export async function getListingDetailBySlug(
  slug: string
): Promise<ListingDetail | null> {
  if (!slug) {
    throw new Error('Listing slug is required');
  }

  const record = (await db.query.listings.findFirst({
    where: eq(listings.slug, slug),
    with: {
      owner: {
        columns: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          locale: true,
        },
      },
      images: {
        columns: {
          id: true,
          url: true,
          alt: true,
          isPrimary: true,
          displayOrder: true,
        },
        orderBy: (fields) => [asc(fields.displayOrder), asc(fields.id)],
      },
      features: {
        columns: {
          id: true,
          label: true,
          value: true,
          icon: true,
        },
        orderBy: (fields) => [asc(fields.label)],
      },
    },
  })) as ListingWithRelations | undefined;

  if (!record) {
    return null;
  }

  return mapListingRecord(record as ListingWithRelations);
}
