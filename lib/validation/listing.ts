import { z } from 'zod';

export const listingMetadataSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(180, 'Title is too long'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(160, 'Slug is too long')
    .optional(),
  description: z
    .string()
    .trim()
    .max(5000, 'Description is too long')
    .optional()
    .nullable(),
  propertyType: z
    .string({ required_error: 'Property type is required' })
    .trim()
    .min(1, 'Property type is required'),
  transactionType: z.enum(['sale', 'rent'], {
    required_error: 'Transaction type is required',
  }),
});

const nullableInt = z
  .number({ invalid_type_error: 'Must be a number' })
  .int('Value must be an integer')
  .min(0, 'Value cannot be negative')
  .max(9999, 'Value is too large')
  .nullable();

export const listingDetailsSchema = z.object({
  street: z
    .string()
    .trim()
    .max(180, 'Street is too long')
    .optional()
    .nullable(),
  city: z
    .string()
    .trim()
    .max(100, 'City is too long')
    .optional(),
  postalCode: z
    .string()
    .trim()
    .max(12, 'Postal code is too long')
    .optional(),
  country: z
    .string()
    .trim()
    .length(2, 'Use the ISO two-letter country code')
    .optional(),
  bedrooms: nullableInt.optional(),
  bathrooms: nullableInt.optional(),
  parkingSpaces: nullableInt.optional(),
  area: nullableInt.optional(),
  lotArea: nullableInt.optional(),
  yearBuilt: nullableInt.optional(),
  energyClass: z
    .string()
    .trim()
    .max(5, 'Energy class is too long')
    .optional()
    .nullable(),
  floor: nullableInt.optional(),
  totalFloors: nullableInt.optional(),
  latitude: z
    .number({ invalid_type_error: 'Latitude must be a number' })
    .min(-90)
    .max(90)
    .nullable()
    .optional(),
  longitude: z
    .number({ invalid_type_error: 'Longitude must be a number' })
    .min(-180)
    .max(180)
    .nullable()
    .optional(),
});

const optionalEmail = z
  .string()
  .email('Enter a valid email address')
  .max(255, 'Email is too long')
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

const optionalPhone = z
  .string()
  .trim()
  .max(32, 'Phone number is too long')
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

export const listingFinishingSchema = z.object({
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative'),
  currency: z
    .string({ required_error: 'Currency is required' })
    .trim()
    .length(3, 'Currency must be a three-letter code'),
  contactEmail: optionalEmail,
  contactPhone: optionalPhone,
  displayEmail: z.boolean().default(true),
  displayPhone: z.boolean().default(true),
});

const promotionTierSchema = z.enum(['standard', 'plus', 'premium']);

export const listingPaymentSchema = z.object({
  promotionTier: promotionTierSchema.default('standard'),
  priceId: z.string().min(3, 'Price is required'),
  durationMultiplier: z.coerce.number().int().min(1).max(12).default(1),
});

export const listingEditorSchema = listingMetadataSchema
  .extend({
    slug: listingMetadataSchema.shape.slug,
    description: listingMetadataSchema.shape.description,
  })
  .merge(listingDetailsSchema)
  .merge(listingFinishingSchema)
  .merge(listingPaymentSchema);

export type ListingMetadataInput = z.infer<typeof listingMetadataSchema>;
export type ListingDetailsInput = z.infer<typeof listingDetailsSchema>;
export type ListingFinishingInput = z.infer<typeof listingFinishingSchema>;
export type ListingPaymentInput = z.infer<typeof listingPaymentSchema>;
export type ListingEditorValues = z.infer<typeof listingEditorSchema>;

export type ListingStep = 'metadata' | 'details' | 'media' | 'finishing' | 'payment' | 'review';
