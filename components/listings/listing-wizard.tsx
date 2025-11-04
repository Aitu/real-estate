'use client';

import {
  type ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Upload, Trash2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

import { ListingStepper, ListingStepperStep } from './listing-stepper';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ListingEditorValues,
  ListingStep,
  listingEditorSchema,
} from '@/lib/validation/listing';
import { slugify } from '@/lib/utils/slug';
import {
  deleteListingImageAction,
  saveListingDraftAction,
  updateListingStatusAction,
  uploadListingMediaAction,
} from '@/app/[locale]/my-listings/actions';
import type { Locale } from '@/lib/i18n/config';

type ListingImageItem = {
  id: number;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  displayOrder: number;
};

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'office', label: 'Office' },
  { value: 'land', label: 'Land' },
];

const TRANSACTION_TYPES = [
  { value: 'sale', label: 'For sale' },
  { value: 'rent', label: 'For rent' },
];

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const STEP_DEFINITIONS: ListingStepperStep[] = [
  {
    id: 'metadata',
    title: 'Listing metadata',
    description: 'Describe the property and choose its type.',
  },
  {
    id: 'details',
    title: 'Property details',
    description: 'Provide location and amenity information.',
  },
  {
    id: 'pricing',
    title: 'Pricing',
    description: 'Set the pricing details and currency.',
  },
  {
    id: 'media',
    title: 'Media',
    description: 'Upload high quality photos to showcase the listing.',
  },
  {
    id: 'review',
    title: 'Review & publish',
    description: 'Double-check every section before publishing.',
  },
];

const STEP_ORDER: ListingStep[] = STEP_DEFINITIONS.map((step) => step.id);

const STEP_FIELDS: Record<ListingStep, Array<keyof ListingEditorValues>> = {
  metadata: ['title', 'slug', 'description', 'propertyType', 'transactionType'],
  details: [
    'street',
    'city',
    'postalCode',
    'country',
    'bedrooms',
    'bathrooms',
    'parkingSpaces',
    'area',
    'lotArea',
    'yearBuilt',
    'energyClass',
    'floor',
    'totalFloors',
    'latitude',
    'longitude',
  ],
  pricing: ['price', 'currency'],
  media: [],
  review: [],
};

const DEFAULT_VALUES: ListingEditorValues = {
  title: '',
  slug: '',
  description: '',
  propertyType: 'apartment',
  transactionType: 'sale',
  street: '',
  city: '',
  postalCode: '',
  country: 'LU',
  bedrooms: null,
  bathrooms: null,
  parkingSpaces: null,
  area: null,
  lotArea: null,
  yearBuilt: null,
  energyClass: null,
  floor: null,
  totalFloors: null,
  latitude: null,
  longitude: null,
  price: 0,
  currency: 'EUR',
};

interface ListingWizardProps {
  locale: Locale;
  initialListingId?: number;
  initialStatus?: 'draft' | 'published';
  initialValues?: Partial<ListingEditorValues>;
  initialImages?: ListingImageItem[];
  initialStep?: ListingStep;
  mode?: 'create' | 'edit';
}

type AutosaveState = 'idle' | 'saving' | 'saved' | 'error';

function getStepPayload(
  step: ListingStep,
  values: ListingEditorValues
): Record<string, unknown> | null {
  const fields = STEP_FIELDS[step];
  if (!fields.length) {
    return null;
  }

  const payload: Record<string, unknown> = {};
  for (const field of fields) {
    payload[field as string] = values[field];
  }

  return payload;
}

function shouldAutosave(step: ListingStep, payload: Record<string, unknown> | null) {
  if (!payload) {
    return false;
  }
  if (step === 'metadata') {
    const title = (payload.title as string | undefined)?.trim();
    return Boolean(title && title.length >= 3);
  }
  if (step === 'pricing') {
    const price = payload.price as number | undefined;
    return typeof price === 'number' && price >= 0;
  }
  return true;
}

function mergeInitialValues(
  initial?: Partial<ListingEditorValues>
): ListingEditorValues {
  return {
    ...DEFAULT_VALUES,
    ...initial,
    slug: initial?.slug ?? DEFAULT_VALUES.slug,
    description: initial?.description ?? DEFAULT_VALUES.description,
    street: initial?.street ?? DEFAULT_VALUES.street,
    city: initial?.city ?? DEFAULT_VALUES.city,
    postalCode: initial?.postalCode ?? DEFAULT_VALUES.postalCode,
    country: initial?.country ?? DEFAULT_VALUES.country,
  };
}

function formatSavedAt(timestamp: string | null): string | null {
  if (!timestamp) {
    return null;
  }
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return null;
  }
}

export function ListingWizard({
  locale,
  initialListingId,
  initialStatus = 'draft',
  initialValues,
  initialImages = [],
  initialStep = 'metadata',
  mode = 'create',
}: ListingWizardProps) {
  const [currentStep, setCurrentStep] = useState<ListingStep>(initialStep);
  const [listingId, setListingId] = useState<number | null>(initialListingId ?? null);
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus);
  const [images, setImages] = useState<ListingImageItem[]>(() =>
    [...initialImages].sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [autoSaveState, setAutoSaveState] = useState<AutosaveState>('idle');
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isStatusUpdating, startStatusTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();

  const defaultValues = useMemo(
    () => mergeInitialValues(initialValues),
    [initialValues]
  );

  const partialEditorSchema = useMemo(() => listingEditorSchema.partial(), []);

  const form = useForm<ListingEditorValues>({
    resolver: zodResolver(partialEditorSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = form.watch();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedByStepRef = useRef<Record<ListingStep, string>>({
    metadata: JSON.stringify(getStepPayload('metadata', defaultValues) ?? {}),
    details: JSON.stringify(getStepPayload('details', defaultValues) ?? {}),
    pricing: JSON.stringify(getStepPayload('pricing', defaultValues) ?? {}),
    media: JSON.stringify({}),
    review: JSON.stringify({}),
  });

  const slugDirtyRef = useRef<boolean>(Boolean(defaultValues.slug));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSavingDraft, startDraftTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (slugDirtyRef.current) {
      return;
    }
    const autoSlug = slugify(form.getValues('title') ?? '');
    if (!autoSlug) {
      form.setValue('slug', '', { shouldDirty: false, shouldTouch: false });
      return;
    }
    const currentSlug = form.getValues('slug') ?? '';
    if (currentSlug !== autoSlug) {
      form.setValue('slug', autoSlug, { shouldDirty: false, shouldTouch: false });
    }
  }, [form, watchedValues.title]);

  useEffect(() => {
    const payload = getStepPayload(currentStep, form.getValues());
    if (!shouldAutosave(currentStep, payload)) {
      return;
    }
    const serialized = JSON.stringify(payload ?? {});
    if (serialized === lastSavedByStepRef.current[currentStep]) {
      return;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setAutoSaveState('saving');
    setAutoSaveError(null);

    autoSaveTimeoutRef.current = setTimeout(() => {
      startDraftTransition(async () => {
        try {
          const result = await saveListingDraftAction({
            locale,
            listingId,
            step: currentStep,
            values: payload ?? {},
          });
          if (!listingId) {
            setListingId(result.listingId);
          }
          if (currentStep === 'metadata' && result.slug) {
            form.setValue('slug', result.slug, { shouldDirty: false, shouldTouch: false });
          }
          lastSavedByStepRef.current[currentStep] = serialized;
          setAutoSaveState('saved');
          setAutoSaveError(null);
          setLastSavedAt(result.savedAt);
        } catch (error) {
          console.error(error);
          setAutoSaveState('error');
          setAutoSaveError((error as Error).message);
        }
      });
    }, 800);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [currentStep, form, listingId, startDraftTransition, watchedValues]);

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>, field: any) => {
    slugDirtyRef.current = true;
    field.onChange(event);
  };

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEP_ORDER.length - 1;

  const navigateToStep = async (direction: 'next' | 'previous') => {
    if (direction === 'previous') {
      if (!isFirstStep) {
        setCurrentStep(STEP_ORDER[currentIndex - 1]);
      }
      return;
    }

    const fields = STEP_FIELDS[currentStep];
    if (fields.length > 0) {
      const valid = await form.trigger(fields as (keyof ListingEditorValues)[], {
        shouldFocus: true,
      });
      if (!valid) {
        return;
      }
    }

    const payload = getStepPayload(currentStep, form.getValues());
    if (shouldAutosave(currentStep, payload)) {
      try {
        const result = await saveListingDraftAction({
          locale,
          listingId,
          step: currentStep,
          values: payload ?? {},
        });
        if (!listingId) {
          setListingId(result.listingId);
        }
        if (currentStep === 'metadata' && result.slug) {
          form.setValue('slug', result.slug, { shouldDirty: false, shouldTouch: false });
        }
        lastSavedByStepRef.current[currentStep] = JSON.stringify(payload ?? {});
        setLastSavedAt(result.savedAt);
        setAutoSaveState('saved');
        setAutoSaveError(null);
      } catch (error) {
        setAutoSaveState('error');
        setAutoSaveError((error as Error).message);
        return;
      }
    }

    if (!isLastStep) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  };

  const handleUploadClick = () => {
    if (!listingId) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0 || !listingId) {
      return;
    }

    const files = Array.from(fileList);

    const validationError = files
      .map((file) => {
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          return `"${file.name}" exceeds the 5MB limit.`;
        }
        if (file.type && !ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          return `"${file.name}" must be a JPEG, PNG, or WebP image.`;
        }
        return null;
      })
      .find((errorMessage): errorMessage is string => Boolean(errorMessage));

    if (validationError) {
      setAutoSaveState('error');
      setAutoSaveError(validationError);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const formData = new FormData();
    formData.append('listingId', String(listingId));
    files.forEach((file) => formData.append('files', file));
    formData.append('locale', locale);

    startUploadTransition(async () => {
      try {
        const result = await uploadListingMediaAction(formData);
        setImages((previous) =>
          [...previous, ...result.images].sort((a, b) => a.displayOrder - b.displayOrder)
        );
        setLastSavedAt(result.savedAt);
        setAutoSaveState('saved');
        setAutoSaveError(null);
      } catch (error) {
        setAutoSaveState('error');
        setAutoSaveError((error as Error).message);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });
  };

  const handleDeleteImage = (imageId: number) => {
    if (!listingId) {
      return;
    }
    startDeleteTransition(async () => {
      try {
        await deleteListingImageAction({ listingId, imageId, locale });
        setImages((previous) => previous.filter((image) => image.id !== imageId));
      } catch (error) {
        setAutoSaveState('error');
        setAutoSaveError((error as Error).message);
      }
    });
  };

  const handlePublishToggle = (nextStatus: 'draft' | 'published') => {
    if (!listingId) {
      return;
    }
    startStatusTransition(async () => {
      try {
        const result = await updateListingStatusAction({
          listingId,
          status: nextStatus,
          locale,
        });
        setStatus(result.status);
        setAutoSaveState('saved');
        setAutoSaveError(null);
      } catch (error) {
        setAutoSaveState('error');
        setAutoSaveError((error as Error).message);
      }
    });
  };

  const savedAtLabel = formatSavedAt(lastSavedAt);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === 'edit' ? 'Edit listing' : 'Create a listing'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Progress is saved automatically. Complete every step to publish your listing.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={
              status === 'published'
                ? 'rounded-full bg-emerald-50 px-3 py-1 text-emerald-600'
                : 'rounded-full bg-slate-100 px-3 py-1 text-slate-600'
            }
          >
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
          {autoSaveState === 'saving' ? (
            <span className="flex items-center gap-1 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          ) : autoSaveState === 'error' && autoSaveError ? (
            <span className="text-rose-500">{autoSaveError}</span>
          ) : savedAtLabel ? (
            <span className="text-slate-400">Saved at {savedAtLabel}</span>
          ) : null}
        </div>
      </div>

      <ListingStepper
        steps={STEP_DEFINITIONS}
        currentStep={currentStep}
        onStepChange={(step) => {
          const targetIndex = STEP_ORDER.indexOf(step);
          if (targetIndex <= currentIndex) {
            setCurrentStep(step);
          }
        }}
      />

      <Form {...form}>
        <form className="space-y-10" onSubmit={(event) => event.preventDefault()}>
          {currentStep === 'metadata' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Sunny two-bedroom apartment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="sunny-two-bedroom-apartment"
                          {...field}
                          onChange={(event) => handleSlugChange(event, field)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="propertyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property type</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          {PROPERTY_TYPES.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          className="grid grid-cols-2 gap-3"
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          {TRANSACTION_TYPES.map((option) => (
                            <label
                              key={option.value}
                              className={
                                'flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-orange-200'
                              }
                            >
                              <RadioGroupItem value={option.value} />
                              {option.label}
                            </label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-6">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the property, its surroundings, and standout amenities."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>
          )}

          {currentStep === 'details' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Grand Rue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Luxembourg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input placeholder="L-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country (ISO code)</FormLabel>
                      <FormControl>
                        <Input placeholder="LU" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {(
                  [
                    { name: 'bedrooms', label: 'Bedrooms' },
                    { name: 'bathrooms', label: 'Bathrooms' },
                    { name: 'parkingSpaces', label: 'Parking spaces' },
                    { name: 'area', label: 'Interior area (sqm)' },
                    { name: 'lotArea', label: 'Lot area (sqm)' },
                    { name: 'yearBuilt', label: 'Year built' },
                    { name: 'floor', label: 'Floor' },
                    { name: 'totalFloors', label: 'Total floors' },
                  ] as Array<{ name: keyof ListingEditorValues; label: string }>
                ).map((item) => (
                  <Controller
                    key={item.name as string}
                    control={form.control}
                    name={item.name as keyof ListingEditorValues}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{item.label}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                            placeholder="—"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="energyClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Energy class</FormLabel>
                      <FormControl>
                        <Input placeholder="A+" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Latitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                            placeholder="49.6117"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Longitude</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                            placeholder="6.1319"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </section>
          )}

          {currentStep === 'pricing' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <Controller
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="1000"
                          value={field.value ?? ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                          placeholder="750000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="EUR">EUR</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}

          {currentStep === 'media' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Listing photos</h2>
                    <p className="text-sm text-slate-500">
                      Upload at least one high resolution photo. The first photo will be used as the cover image.
                    </p>
                    <p className="text-xs text-slate-400">
                      Accepts JPEG, PNG, or WebP files up to 5MB each.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFilesSelected}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleUploadClick}
                      disabled={!listingId || isUploading}
                      className="rounded-full"
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload photos
                    </Button>
                  </div>
                </div>

                {!listingId && (
                  <p className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">
                    Save the listing metadata first to enable media uploads.
                  </p>
                )}

                {images.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 text-center text-sm text-slate-500">
                    <Upload className="mb-2 h-6 w-6" />
                    <p>No photos uploaded yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200"
                      >
                        <img
                          src={image.url}
                          alt={image.alt ?? ''}
                          className="aspect-square w-full object-cover transition group-hover:scale-105"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-white"
                          onClick={() => handleDeleteImage(image.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {currentStep === 'review' && (
            <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                <span>Review each section carefully before publishing the listing.</span>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Basics</h3>
                  <dl className="mt-3 space-y-1 text-sm text-slate-600">
                    <div>
                      <dt className="font-medium text-slate-500">Title</dt>
                      <dd>{watchedValues.title || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Slug</dt>
                      <dd>{watchedValues.slug || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Type</dt>
                      <dd>{watchedValues.propertyType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Transaction</dt>
                      <dd>{watchedValues.transactionType === 'sale' ? 'For sale' : 'For rent'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Price</dt>
                      <dd>
                        {watchedValues.price
                          ? new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: watchedValues.currency ?? 'EUR',
                            }).format(watchedValues.price)
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Location</h3>
                  <dl className="mt-3 space-y-1 text-sm text-slate-600">
                    <div>
                      <dt className="font-medium text-slate-500">Street</dt>
                      <dd>{watchedValues.street || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">City</dt>
                      <dd>{watchedValues.city || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Postal code</dt>
                      <dd>{watchedValues.postalCode || '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Country</dt>
                      <dd>{watchedValues.country || '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Highlights</h3>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
                    <div>
                      <dt className="font-medium text-slate-500">Bedrooms</dt>
                      <dd>{watchedValues.bedrooms ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Bathrooms</dt>
                      <dd>{watchedValues.bathrooms ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Parking</dt>
                      <dd>{watchedValues.parkingSpaces ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Area</dt>
                      <dd>{watchedValues.area ? `${watchedValues.area} m²` : '—'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Media</h3>
                  <p className="mt-3 text-sm text-slate-600">
                    {images.length > 0
                      ? `${images.length} ${images.length === 1 ? 'photo' : 'photos'} uploaded.`
                      : 'No photos uploaded yet.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => handlePublishToggle('published')}
                  disabled={!listingId || status === 'published' || isStatusUpdating}
                  className="rounded-full"
                >
                  {isStatusUpdating && status !== 'published' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Publish listing
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePublishToggle('draft')}
                  disabled={!listingId || status === 'draft' || isStatusUpdating}
                  className="rounded-full"
                >
                  {isStatusUpdating && status === 'published' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Save as draft
                </Button>
              </div>
            </section>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 md:flex-row md:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigateToStep('previous')}
              disabled={isFirstStep}
              className="rounded-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Previous
            </Button>
            <div className="flex gap-3">
              {!isLastStep && (
                <Button
                  type="button"
                  onClick={() => navigateToStep('next')}
                  disabled={isSavingDraft || (currentStep === 'media' && !listingId)}
                  className="rounded-full"
                >
                  Next step <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
