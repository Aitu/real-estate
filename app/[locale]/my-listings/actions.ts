'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { loadMessages } from '@/lib/i18n/get-messages';
import { getTranslator } from '@/lib/i18n/server';
import { isLocale, type Locale } from '@/lib/i18n/config';
import {
  createListingForOwner,
  deactivateListingForOwner,
  getListingsForOwner,
  updateListingForOwner,
  type OwnerListingSort,
} from '@/lib/db/listings';
import { validatedActionWithUser, type ActionState } from '@/lib/auth/middleware';
import type { ListingStatus } from '@/lib/types/listing';

const optionalNumericField = z
  .string()
  .optional()
  .transform((value) => {
    if (value == null) {
      return null;
    }
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.round(parsed) : Number.NaN;
  })
  .refine((value) => value === null || !Number.isNaN(value), 'Invalid number');

const listingSchema = z.object({
  locale: z.string().min(2).max(5),
  title: z.string().min(3).max(180),
  description: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }),
  propertyType: z.string().min(1).max(50),
  transactionType: z.enum(['sale', 'rent']),
  status: z.enum(['draft', 'published', 'inactive']),
  price: z.coerce.number().int().positive(),
  currency: z.string().min(3).max(3),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(12),
  country: z.string().min(2).max(2),
  street: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return null;
      const trimmed = value.trim();
      return trimmed === '' ? null : trimmed;
    }),
  bedrooms: optionalNumericField,
  bathrooms: optionalNumericField,
  area: optionalNumericField,
});

type ListingSchema = z.infer<typeof listingSchema>;

const updateListingSchema = listingSchema.extend({
  listingId: z.coerce.number().int().positive(),
});

const listingFieldNames = [
  'title',
  'description',
  'propertyType',
  'transactionType',
  'status',
  'price',
  'currency',
  'city',
  'postalCode',
  'country',
  'street',
  'bedrooms',
  'bathrooms',
  'area',
] as const;

export type ListingFormField = (typeof listingFieldNames)[number];

export type ListingFormState = ActionState & {
  fields: Partial<Record<ListingFormField, string>>;
};

export const initialListingFormState: ListingFormState = {
  fields: {},
};

function getFieldValues(formData: FormData) {
  const fields: Partial<Record<ListingFormField, string>> = {};
  for (const key of listingFieldNames) {
    const value = formData.get(key);
    if (typeof value === 'string') {
      fields[key] = value;
    }
  }
  return fields;
}

async function getTranslatorForLocale(locale: string, namespace: string) {
  if (!isLocale(locale)) {
    throw new Error('Unsupported locale');
  }

  const messages = await loadMessages(locale as Locale);
  return getTranslator(locale as Locale, messages, namespace);
}

function mapListingInput(data: ListingSchema) {
  return {
    title: data.title,
    description: data.description,
    propertyType: data.propertyType,
    transactionType: data.transactionType,
    status: data.status as ListingStatus,
    price: data.price,
    currency: data.currency,
    city: data.city,
    postalCode: data.postalCode,
    country: data.country,
    street: data.street,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    area: data.area,
  };
}

export const createListing = validatedActionWithUser(
  listingSchema,
  async (data, formData, user): Promise<ListingFormState> => {
    const t = await getTranslatorForLocale(data.locale, 'myListings');

    try {
      await createListingForOwner(user.id, mapListingInput(data));
    } catch (error) {
      console.error('Failed to create listing', error);
      return {
        error: t('errors.create'),
        fields: getFieldValues(formData),
      };
    }

    revalidatePath(`/${data.locale}/my-listings`);

    return {
      success: t('messages.createSuccess'),
      fields: {},
    };
  }
);

export const updateListing = validatedActionWithUser(
  updateListingSchema,
  async (data, formData, user): Promise<ListingFormState> => {
    const t = await getTranslatorForLocale(data.locale, 'myListings');

    try {
      await updateListingForOwner(
        user.id,
        data.listingId,
        mapListingInput(data)
      );
    } catch (error) {
      console.error('Failed to update listing', error);
      return {
        error: t('errors.update'),
        fields: getFieldValues(formData),
      };
    }

    revalidatePath(`/${data.locale}/my-listings`);

    return {
      success: t('messages.updateSuccess'),
      fields: {},
    };
  }
);

const deactivateSchema = z.object({
  locale: z.string().min(2).max(5),
  listingId: z.coerce.number().int().positive(),
});

export const deactivateListing = validatedActionWithUser(
  deactivateSchema,
  async (data, formData, user): Promise<ActionState> => {
    const t = await getTranslatorForLocale(data.locale, 'myListings');

    try {
      await deactivateListingForOwner(user.id, data.listingId);
    } catch (error) {
      console.error('Failed to deactivate listing', error);
      return {
        error: t('errors.deactivate'),
      };
    }

    revalidatePath(`/${data.locale}/my-listings`);

    return {
      success: t('messages.deactivateSuccess'),
    };
  }
);

export async function fetchOwnerListings(
  ownerId: number,
  options: { page: number; pageSize: number; sort: OwnerListingSort }
) {
  return getListingsForOwner(ownerId, options);
}
