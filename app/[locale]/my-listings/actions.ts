'use server';

import { Buffer } from 'node:buffer';
import { revalidatePath } from 'next/cache';
import { and, count, eq, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { listingImages, listings } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import {
  ListingDetailsInput,
  ListingMetadataInput,
  ListingPricingInput,
  ListingStep,
  listingDetailsSchema,
  listingMetadataSchema,
  listingPricingSchema,
} from '@/lib/validation/listing';
import { generateDraftSlug, slugify } from '@/lib/utils/slug';
import { isLocale } from '@/lib/i18n/config';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

function normalizeLocale(locale: string): string {
  if (!isLocale(locale)) {
    throw new Error('Unsupported locale provided');
  }
  return locale;
}

function revalidateListingViews(locale: string, listingId: number) {
  revalidatePath(`/${locale}/my-listings`);
  revalidatePath(`/${locale}/my-listings/${listingId}`);
}

function validateImageFile(file: File) {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Images must be 5MB or smaller.');
  }

  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, or WebP images are supported.');
  }
}

async function fileToDataUrl(file: File) {
  validateImageFile(file);

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = file.type || 'application/octet-stream';
  return `data:${mimeType};base64,${base64}`;
}

type SaveListingDraftInput = {
  locale: string;
  listingId?: number | null;
  step: ListingStep;
  values: Record<string, unknown>;
};

type SaveListingDraftResult = {
  listingId: number;
  slug: string;
  status: 'created' | 'updated';
  step: ListingStep;
  savedAt: string;
};

async function requireUser() {
  const user = await getUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

async function requireOwnedListing(listingId: number, ownerId: number) {
  const [record] = await db
    .select({
      id: listings.id,
      ownerId: listings.ownerId,
      slug: listings.slug,
      title: listings.title,
      price: listings.price,
      city: listings.city,
      postalCode: listings.postalCode,
      status: listings.status,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (!record) {
    throw new Error('Listing not found');
  }
  if (record.ownerId !== ownerId) {
    throw new Error('You do not have permission to modify this listing');
  }

  return record;
}

async function ensureUniqueSlug(base: string, listingId?: number) {
  const normalized = slugify(base);
  let candidate = normalized || generateDraftSlug();
  let attempt = 1;

  while (true) {
    const conditions = [eq(listings.slug, candidate)];
    if (listingId) {
      conditions.push(ne(listings.id, listingId));
    }
    const existing = await db
      .select({ id: listings.id })
      .from(listings)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(1);
    if (existing.length === 0) {
      return candidate;
    }
    attempt += 1;
    candidate = normalized ? `${normalized}-${attempt}` : generateDraftSlug();
  }
}

function mapMetadataToInsert(
  ownerId: number,
  parsed: ListingMetadataInput,
  slug: string
) {
  const now = new Date();
  return {
    ownerId,
    status: 'draft' as const,
    slug,
    title: parsed.title,
    description: parsed.description ?? null,
    propertyType: parsed.propertyType,
    transactionType: parsed.transactionType,
    price: 0,
    currency: 'EUR',
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    area: null,
    lotArea: null,
    yearBuilt: null,
    energyClass: null,
    floor: null,
    totalFloors: null,
    street: '',
    city: '',
    postalCode: '',
    country: 'LU',
    latitude: null,
    longitude: null,
    createdAt: now,
    updatedAt: now,
  };
}

function mapMetadataToUpdate(parsed: ListingMetadataInput, slug: string) {
  return {
    title: parsed.title,
    description: parsed.description ?? null,
    propertyType: parsed.propertyType,
    transactionType: parsed.transactionType,
    slug,
    updatedAt: new Date(),
  };
}

function mapDetailsToUpdate(parsed: ListingDetailsInput) {
  return {
    street: parsed.street ?? '',
    city: parsed.city ?? '',
    postalCode: parsed.postalCode ?? '',
    country: parsed.country ?? 'LU',
    bedrooms: parsed.bedrooms ?? null,
    bathrooms: parsed.bathrooms ?? null,
    parkingSpaces: parsed.parkingSpaces ?? null,
    area: parsed.area ?? null,
    lotArea: parsed.lotArea ?? null,
    yearBuilt: parsed.yearBuilt ?? null,
    energyClass: parsed.energyClass ?? null,
    floor: parsed.floor ?? null,
    totalFloors: parsed.totalFloors ?? null,
    latitude: parsed.latitude ?? null,
    longitude: parsed.longitude ?? null,
    updatedAt: new Date(),
  };
}

function mapPricingToUpdate(parsed: ListingPricingInput) {
  return {
    price: Math.round(parsed.price),
    currency: parsed.currency.toUpperCase(),
    updatedAt: new Date(),
  };
}

export async function saveListingDraftAction(
  input: SaveListingDraftInput
): Promise<SaveListingDraftResult> {
  const locale = normalizeLocale(input.locale);

  if (input.step === 'media' || input.step === 'review') {
    if (!input.listingId) {
      throw new Error('Listing id is required to continue');
    }
    const user = await requireUser();
    await requireOwnedListing(input.listingId, user.id);
    return {
      listingId: input.listingId,
      slug: '',
      status: 'updated',
      step: input.step,
      savedAt: new Date().toISOString(),
    };
  }

  const user = await requireUser();
  const now = new Date();

  if (input.step === 'metadata') {
    const parsed = listingMetadataSchema.parse(input.values);
    if (!input.listingId) {
      const slug = await ensureUniqueSlug(parsed.slug ?? parsed.title);
      const [created] = await db
        .insert(listings)
        .values(mapMetadataToInsert(user.id, parsed, slug))
        .returning({ id: listings.id, slug: listings.slug });

      revalidateListingViews(locale, created.id);

      return {
        listingId: created.id,
        slug: created.slug,
        status: 'created',
        step: 'metadata',
        savedAt: now.toISOString(),
      };
    }

    const existing = await requireOwnedListing(input.listingId, user.id);
    const desiredSlug = parsed.slug ?? existing.slug;
    const slug = desiredSlug === existing.slug
      ? existing.slug
      : await ensureUniqueSlug(desiredSlug, existing.id);

    await db
      .update(listings)
      .set(mapMetadataToUpdate(parsed, slug))
      .where(and(eq(listings.id, existing.id), eq(listings.ownerId, user.id)));

    revalidateListingViews(locale, existing.id);

    return {
      listingId: existing.id,
      slug,
      status: 'updated',
      step: 'metadata',
      savedAt: now.toISOString(),
    };
  }

  if (!input.listingId) {
    throw new Error('Listing id is required to update this step');
  }

  await requireOwnedListing(input.listingId, user.id);

  if (input.step === 'details') {
    const parsed = listingDetailsSchema.parse(input.values);
    await db
      .update(listings)
      .set(mapDetailsToUpdate(parsed))
      .where(and(eq(listings.id, input.listingId), eq(listings.ownerId, user.id)));

    revalidateListingViews(locale, input.listingId);

    return {
      listingId: input.listingId,
      slug: '',
      status: 'updated',
      step: 'details',
      savedAt: now.toISOString(),
    };
  }

  if (input.step === 'pricing') {
    const parsed = listingPricingSchema.parse(input.values);
    await db
      .update(listings)
      .set(mapPricingToUpdate(parsed))
      .where(and(eq(listings.id, input.listingId), eq(listings.ownerId, user.id)));

    revalidateListingViews(locale, input.listingId);

    return {
      listingId: input.listingId,
      slug: '',
      status: 'updated',
      step: 'pricing',
      savedAt: now.toISOString(),
    };
  }

  throw new Error(`Unhandled step: ${input.step satisfies never}`);
}

export async function uploadListingMediaAction(formData: FormData) {
  const user = await requireUser();
  const localeValue = formData.get('locale');
  if (typeof localeValue !== 'string') {
    throw new Error('Locale is required to upload media');
  }
  const locale = normalizeLocale(localeValue);
  const listingIdValue = formData.get('listingId');
  const listingId = Number(listingIdValue);

  if (!listingId || Number.isNaN(listingId)) {
    throw new Error('A valid listing id is required to upload media');
  }

  await requireOwnedListing(listingId, user.id);

  const files = formData
    .getAll('files')
    .filter((file): file is File => file instanceof File && file.size > 0);

  if (files.length === 0) {
    throw new Error('No files were provided');
  }

  const [orderResult] = await db
    .select({
      maxOrder: sql<number>`COALESCE(MAX(${listingImages.displayOrder}), 0)`
    })
    .from(listingImages)
    .where(eq(listingImages.listingId, listingId));

  let nextOrder = (orderResult?.maxOrder ?? 0) + 1;
  const savedAt = new Date();

  const uploaded = [] as Array<{
    id: number;
    url: string;
    alt: string | null;
    isPrimary: boolean;
    displayOrder: number;
  }>;

  for (const file of files) {
    const dataUrl = await fileToDataUrl(file);

    const [record] = await db
      .insert(listingImages)
      .values({
        listingId,
        url: dataUrl,
        alt: file.name,
        isPrimary: false,
        displayOrder: nextOrder,
      })
      .returning({
        id: listingImages.id,
        url: listingImages.url,
        alt: listingImages.alt,
        isPrimary: listingImages.isPrimary,
        displayOrder: listingImages.displayOrder,
      });

    uploaded.push(record);
    nextOrder += 1;
  }

  revalidateListingViews(locale, listingId);

  return {
    listingId,
    images: uploaded,
    savedAt: savedAt.toISOString(),
  };
}

export async function deleteListingImageAction(params: {
  listingId: number;
  imageId: number;
  locale: string;
}) {
  const user = await requireUser();
  const locale = normalizeLocale(params.locale);
  await requireOwnedListing(params.listingId, user.id);

  const [image] = await db
    .select({
      id: listingImages.id,
      url: listingImages.url,
    })
    .from(listingImages)
    .where(
      and(
        eq(listingImages.id, params.imageId),
        eq(listingImages.listingId, params.listingId)
      )
    )
    .limit(1);

  if (!image) {
    throw new Error('Image not found');
  }

  await db
    .delete(listingImages)
    .where(eq(listingImages.id, params.imageId));

  revalidateListingViews(locale, params.listingId);

  return { listingId: params.listingId, imageId: params.imageId };
}

export async function updateListingStatusAction(params: {
  listingId: number;
  status: 'draft' | 'published';
  locale: string;
}) {
  const user = await requireUser();
  const locale = normalizeLocale(params.locale);
  const listing = await requireOwnedListing(params.listingId, user.id);

  if (params.status === 'published') {
    if (!listing.title?.trim()) {
      throw new Error('Add a title before publishing the listing');
    }
    if (!listing.price || listing.price <= 0) {
      throw new Error('Set a price before publishing the listing');
    }
    if (!listing.city?.trim() || !listing.postalCode?.trim()) {
      throw new Error('Provide the property location before publishing');
    }
    const [imageCount] = await db
      .select({ value: count() })
      .from(listingImages)
      .where(eq(listingImages.listingId, params.listingId));
    if (!imageCount || Number(imageCount.value) === 0) {
      throw new Error('Upload at least one photo before publishing');
    }
  }

  await db
    .update(listings)
    .set({
      status: params.status,
      publishedAt: params.status === 'published' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(listings.id, params.listingId), eq(listings.ownerId, user.id)));

  revalidateListingViews(locale, params.listingId);

  return { listingId: params.listingId, status: params.status };
}
