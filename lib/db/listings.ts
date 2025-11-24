import { and, asc, desc, eq, gt, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from './drizzle';
import { favorites, listings } from './schema';
import type { ListingDetail } from '@/lib/types/listing';
import type {
  Listing as ListingRow,
  ListingImage as ListingImageRow,
  PropertyFeature as PropertyFeatureRow,
  User,
} from './schema';
import type { ListingStatus, OwnerListing } from '@/lib/types/listing';

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
    contactEmail: record.displayEmail
      ? record.contactEmail ?? owner.email
      : null,
    contactPhone: record.displayPhone
      ? record.contactPhone ?? owner.phoneNumber
      : null,
    promotionTier: record.promotionTier ?? 'standard',
    paymentStatus: record.paymentStatus ?? 'unpaid',
    paidAt: toIsoString(record.paidAt),
    expiresAt: toIsoString(record.expiresAt),
    displayEmail: record.displayEmail ?? true,
    displayPhone: record.displayPhone ?? true,
  viewsCount: record.viewsCount ?? 0,
  contactsCount: record.contactsCount ?? 0,
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

export async function incrementListingView(
  listingId: number,
  viewerId?: number
): Promise<void> {
  const conditions = [
    eq(listings.id, listingId),
    eq(listings.status, 'published'),
    isNotNull(listings.expiresAt),
    gt(listings.expiresAt, new Date()),
  ];
  if (viewerId) {
    conditions.push(ne(listings.ownerId, viewerId));
  }

  await db
    .update(listings)
    .set({ viewsCount: sql`COALESCE(${listings.viewsCount}, 0) + 1` })
    .where(and(...conditions));
}

export async function incrementListingContact(
  listingId: number,
  viewerId?: number
): Promise<void> {
  const conditions = [
    eq(listings.id, listingId),
    eq(listings.status, 'published'),
    isNotNull(listings.expiresAt),
    gt(listings.expiresAt, new Date()),
  ];
  if (viewerId) {
    conditions.push(ne(listings.ownerId, viewerId));
  }

  await db
    .update(listings)
    .set({ contactsCount: sql`COALESCE(${listings.contactsCount}, 0) + 1` })
    .where(and(...conditions));
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

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title);
  if (!base) {
    throw new Error('Listing title cannot produce a slug');
  }

  let slug = base;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await db.query.listings.findFirst({
      where: eq(listings.slug, slug),
      columns: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${suffix++}`;
  }
}

export type OwnerListingSort =
  | 'created-desc'
  | 'created-asc'
  | 'price-desc'
  | 'price-asc';

export async function getListingsForOwner(
  ownerId: number,
  {
    page,
    pageSize,
    sort,
  }: { page: number; pageSize: number; sort: OwnerListingSort }
): Promise<{ listings: OwnerListing[]; totalCount: number }> {
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
  const offset = (currentPage - 1) * limit;

  const [records, countResult] = await Promise.all([
    db.query.listings.findMany({
      where: eq(listings.ownerId, ownerId),
      columns: {
        id: true,
        slug: true,
        title: true,
        description: true,
        propertyType: true,
        transactionType: true,
        status: true,
        price: true,
        currency: true,
        city: true,
        postalCode: true,
        country: true,
        street: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        contactEmail: true,
        contactPhone: true,
        displayEmail: true,
        displayPhone: true,
        viewsCount: true,
        contactsCount: true,
        favoritesCount: sql<number>`(select count(*) from ${favorites} f where f.listing_id = ${listings.id})`,
        promotionTier: true,
        paymentStatus: true,
        paidAt: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: (fields, operators) => {
        switch (sort) {
          case 'created-asc':
            return [operators.asc(fields.createdAt)];
          case 'price-desc':
            return [operators.desc(fields.price), operators.desc(fields.id)];
          case 'price-asc':
            return [operators.asc(fields.price), operators.desc(fields.id)];
          case 'created-desc':
          default:
            return [operators.desc(fields.createdAt)];
        }
      },
      limit,
      offset,
    }),
    db
      .select({ value: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.ownerId, ownerId))
      .limit(1),
  ]);

  const totalCount = countResult[0]?.value ?? 0;

  const mapped = records.map((record) => ({
    ...record,
    transactionType: record.transactionType === 'rent' ? 'rent' : 'sale',
    status: record.status as ListingStatus,
    publishedAt: record.publishedAt ? record.publishedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    displayEmail: record.displayEmail ?? true,
    displayPhone: record.displayPhone ?? true,
    promotionTier: record.promotionTier ?? 'standard',
    paymentStatus: record.paymentStatus ?? 'unpaid',
    paidAt: record.paidAt ? record.paidAt.toISOString() : null,
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    viewsCount: record.viewsCount ?? 0,
    contactsCount: record.contactsCount ?? 0,
    favoritesCount: (record as any).favoritesCount ?? 0,
  } satisfies OwnerListing));

  return { listings: mapped, totalCount };
}

type ListingInput = {
  title: string;
  description: string | null;
  propertyType: string;
  transactionType: 'sale' | 'rent';
  status: ListingStatus;
  price: number;
  currency: string;
  city: string;
  postalCode: string;
  country: string;
  street: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  displayEmail: boolean;
  displayPhone: boolean;
  promotionTier?: 'standard' | 'plus' | 'premium';
  paymentStatus?: 'paid' | 'unpaid';
};

export async function createListingForOwner(
  ownerId: number,
  input: ListingInput
): Promise<OwnerListing> {
  const slug = await generateUniqueSlug(input.title);
  const publishedAt =
    input.status === 'published' ? new Date() : null;

  const [created] = await db
    .insert(listings)
    .values({
      ownerId,
      slug,
      title: input.title,
      description: input.description,
      propertyType: input.propertyType,
      transactionType: input.transactionType,
      status: input.status,
      price: input.price,
      currency: input.currency,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country,
      street: input.street,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      displayEmail: input.displayEmail,
      displayPhone: input.displayPhone,
      promotionTier: input.promotionTier ?? 'standard',
      paymentStatus:
        input.paymentStatus ?? (input.status === 'published' ? 'paid' : 'unpaid'),
      paidAt: input.paymentStatus === 'paid' || input.status === 'published' ? new Date() : null,
      publishedAt,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create listing');
  }

  return {
    id: created.id,
    slug: created.slug,
    title: created.title,
    description: created.description,
    propertyType: created.propertyType,
    transactionType: created.transactionType as 'sale' | 'rent',
    status: created.status as ListingStatus,
    price: created.price,
    currency: created.currency,
    city: created.city,
    postalCode: created.postalCode,
    country: created.country,
    street: created.street,
    bedrooms: created.bedrooms,
    bathrooms: created.bathrooms,
    area: created.area,
    contactEmail: created.contactEmail,
    contactPhone: created.contactPhone,
    displayEmail: created.displayEmail ?? true,
    displayPhone: created.displayPhone ?? true,
    promotionTier: created.promotionTier ?? 'standard',
    paymentStatus: created.paymentStatus ?? 'unpaid',
    paidAt: created.paidAt ? created.paidAt.toISOString() : null,
    expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
    publishedAt: created.publishedAt
      ? created.publishedAt.toISOString()
      : null,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  } satisfies OwnerListing;
}

export async function updateListingForOwner(
  ownerId: number,
  listingId: number,
  input: ListingInput
): Promise<OwnerListing> {
  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, listingId), eq(listings.ownerId, ownerId)),
    columns: { id: true, slug: true, publishedAt: true },
  });

  if (!existing) {
    throw new Error('Listing not found');
  }

  const publishedAtValue =
    input.status === 'published'
      ? existing.publishedAt ?? new Date()
      : null;

  const [updated] = await db
    .update(listings)
    .set({
      title: input.title,
      description: input.description,
      propertyType: input.propertyType,
      transactionType: input.transactionType,
      status: input.status,
      price: input.price,
      currency: input.currency,
      city: input.city,
      postalCode: input.postalCode,
      country: input.country,
      street: input.street,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      area: input.area,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      displayEmail: input.displayEmail,
      displayPhone: input.displayPhone,
      promotionTier: input.promotionTier ?? 'standard',
      paymentStatus:
        input.paymentStatus ?? (input.status === 'published' ? 'paid' : 'unpaid'),
      paidAt:
        input.paymentStatus === 'paid' || input.status === 'published'
          ? existing.publishedAt ?? new Date()
          : null,
      updatedAt: new Date(),
      publishedAt: publishedAtValue,
    })
    .where(eq(listings.id, listingId))
    .returning();

  if (!updated) {
    throw new Error('Failed to update listing');
  }

  return {
    id: updated.id,
    slug: updated.slug,
    title: updated.title,
    description: updated.description,
    propertyType: updated.propertyType,
    transactionType: updated.transactionType as 'sale' | 'rent',
    status: updated.status as ListingStatus,
    price: updated.price,
    currency: updated.currency,
    city: updated.city,
    postalCode: updated.postalCode,
    country: updated.country,
    street: updated.street,
    bedrooms: updated.bedrooms,
    bathrooms: updated.bathrooms,
    area: updated.area,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    displayEmail: updated.displayEmail ?? true,
    displayPhone: updated.displayPhone ?? true,
    promotionTier: updated.promotionTier ?? 'standard',
    paymentStatus: updated.paymentStatus ?? 'unpaid',
    paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
    expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
    publishedAt: updated.publishedAt
      ? updated.publishedAt.toISOString()
      : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  } satisfies OwnerListing;
}

export async function deactivateListingForOwner(
  ownerId: number,
  listingId: number
): Promise<void> {
  const existing = await db.query.listings.findFirst({
    where: and(eq(listings.id, listingId), eq(listings.ownerId, ownerId)),
    columns: { id: true },
  });

  if (!existing) {
    throw new Error('Listing not found');
  }

  await db
    .update(listings)
    .set({ status: 'inactive', publishedAt: null, updatedAt: new Date() })
    .where(eq(listings.id, listingId));
}
