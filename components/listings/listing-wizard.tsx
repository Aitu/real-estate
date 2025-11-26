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

import { ListingStepper } from './listing-stepper';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ListingEditorValues,
  ListingStep,
  listingEditorSchema,
} from '@/lib/validation/listing';
import { slugify } from '@/lib/utils/slug';
import {
  deleteListingImageAction,
  completeListingPaymentAction,
  saveListingDraftAction,
  updateListingStatusAction,
  uploadListingMediaAction,
} from '@/app/[locale]/(marketing)/my-listings/actions';
import type { Locale } from '@/lib/i18n/config';
import type { ListingPlanOption } from '@/lib/listings/plans';
import { LISTING_STEP_DEFINITIONS, LISTING_STEP_IDS } from '@/lib/listings/step-definitions';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useTranslations } from '@/lib/i18n/provider';

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

const STEP_ORDER: ListingStep[] = [...LISTING_STEP_IDS];

const STEP_FIELDS: Record<ListingStep, Array<keyof ListingEditorValues>> = {
  metadata: ['title', 'description', 'propertyType', 'transactionType'],
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
  media: [],
  finishing: ['price', 'currency', 'contactEmail', 'contactPhone', 'displayEmail', 'displayPhone'],
  payment: ['promotionTier', 'priceId', 'durationMultiplier'],
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
  contactEmail: '',
  contactPhone: '',
  displayEmail: true,
  displayPhone: true,
  promotionTier: 'standard',
  priceId: '',
  durationMultiplier: 1,
};

interface ListingWizardProps {
  locale: Locale;
  plans: ListingPlanOption[];
  initialListingId?: number;
  initialStatus?: 'draft' | 'published';
  initialValues?: Partial<ListingEditorValues>;
  initialImages?: ListingImageItem[];
  initialStep?: ListingStep;
  mode?: 'create' | 'edit';
  initialPaymentStatus?: 'unpaid' | 'paid';
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
  if (step === 'finishing') {
    const price = payload.price as number | undefined;
    return typeof price === 'number' && price >= 0;
  }
  if (step === 'payment') {
    const priceId = payload.priceId as string | undefined;
    return Boolean(priceId && priceId.trim().length > 0);
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
    priceId: initial?.priceId ?? DEFAULT_VALUES.priceId,
    durationMultiplier: initial?.durationMultiplier ?? DEFAULT_VALUES.durationMultiplier,
  };
}

function VisibilityToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border transition-colors',
        checked
          ? 'border-emerald-300 bg-emerald-500/80'
          : 'border-slate-200 bg-slate-200'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
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

function formatCurrencyValue(amountMinor: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

function formatDurationLabel(months: number) {
  if (!Number.isFinite(months)) {
    return '';
  }
  return `${months} month${months === 1 ? '' : 's'}`;
}

export function ListingWizard({
  locale,
  plans,
  initialListingId,
  initialStatus = 'draft',
  initialValues,
  initialImages = [],
  initialStep = 'metadata',
  mode = 'create',
  initialPaymentStatus = 'unpaid',
}: ListingWizardProps) {
  const tWizard = useTranslations('listingWizard');
  const [currentStep, setCurrentStep] = useState<ListingStep>(initialStep);
  const [listingId, setListingId] = useState<number | null>(initialListingId ?? null);
  const [status, setStatus] = useState<'draft' | 'published'>(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState<'unpaid' | 'paid'>(
    initialStatus === 'published' ? 'paid' : initialPaymentStatus
  );
  const [images, setImages] = useState<ListingImageItem[]>(() =>
    [...initialImages].sort((a, b) => a.displayOrder - b.displayOrder)
  );
  const [autoSaveState, setAutoSaveState] = useState<AutosaveState>('idle');
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isStatusUpdating, startStatusTransition] = useTransition();
  const [isUploading, startUploadTransition] = useTransition();
  const [isPaying, startPaymentTransition] = useTransition();
  const { user } = useCurrentUser();

  const defaultValues = useMemo(
    () => {
      const merged = mergeInitialValues(initialValues);
      const fallbackPlan =
        plans.find((plan) => plan.priceId === merged.priceId) ??
        plans.find((plan) => plan.tier === merged.promotionTier) ??
        plans[0];

      if (!merged.priceId && fallbackPlan) {
        merged.priceId = fallbackPlan.priceId;
      }

      if (fallbackPlan) {
        const desiredMultiplier = merged.durationMultiplier ?? 1;
        merged.durationMultiplier = fallbackPlan.multipliers.includes(desiredMultiplier)
          ? desiredMultiplier
          : fallbackPlan.multipliers[0] ?? 1;
        merged.promotionTier = fallbackPlan.tier;
      } else {
        merged.durationMultiplier = merged.durationMultiplier ?? 1;
      }

      return merged;
    },
    [initialValues, plans]
  );

  const partialEditorSchema = useMemo(() => listingEditorSchema.partial(), []);

  const form = useForm<ListingEditorValues>({
    resolver: zodResolver(partialEditorSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = form.watch();
  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.priceId === watchedValues.priceId) ??
      plans[0] ??
      null,
    [plans, watchedValues.priceId]
  );
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedByStepRef = useRef<Record<ListingStep, string>>({
    metadata: JSON.stringify(getStepPayload('metadata', defaultValues) ?? {}),
    details: JSON.stringify(getStepPayload('details', defaultValues) ?? {}),
    media: JSON.stringify({}),
    finishing: JSON.stringify(getStepPayload('finishing', defaultValues) ?? {}),
    payment: JSON.stringify(getStepPayload('payment', defaultValues) ?? {}),
    review: JSON.stringify({}),
  });

  const slugDirtyRef = useRef<boolean>(Boolean(defaultValues.slug));
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSavingDraft, startDraftTransition] = useTransition();

  useEffect(() => {
    if (!selectedPlan) {
      return;
    }

    if (form.getValues('promotionTier') !== selectedPlan.tier) {
      form.setValue('promotionTier', selectedPlan.tier, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    const currentMultiplier = Number(form.getValues('durationMultiplier') ?? 1);
    if (!selectedPlan.multipliers.includes(currentMultiplier)) {
      form.setValue('durationMultiplier', selectedPlan.multipliers[0] ?? 1, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [form, selectedPlan]);

  useEffect(() => {
    if (user?.email && !form.getValues('contactEmail')) {
      form.setValue('contactEmail', user.email, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
    if (user?.phoneNumber && !form.getValues('contactPhone')) {
      form.setValue('contactPhone', user.phoneNumber, {
        shouldDirty: false,
        shouldTouch: false,
      });
    }
  }, [user, form]);

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

  const stepsWithTranslations = useMemo(
    () =>
      LISTING_STEP_DEFINITIONS.map((step) => ({
        ...step,
        title: tWizard(`steps.${step.id}.title`),
        description: step.description ? tWizard(`steps.${step.id}.description`) : undefined,
      })),
    [tWizard]
  );
  const tf = (path: string) => tWizard(`fields.${path}`);

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

  const handleCompletePayment = () => {
    if (!listingId) {
      setAutoSaveState('error');
      setAutoSaveError('Save your listing details first, then return to payment.');
      return;
    }
    const priceId = form.getValues('priceId');
    const durationMultiplier = Number(form.getValues('durationMultiplier') ?? 1);
    if (!priceId) {
      setAutoSaveState('error');
      setAutoSaveError('Select a Stripe plan before paying.');
      return;
    }
    if (!selectedPlan) {
      setAutoSaveState('error');
      setAutoSaveError('No listing plans are available. Please contact support.');
      return;
    }
    startPaymentTransition(async () => {
      try {
        const result = await completeListingPaymentAction({
          listingId,
          locale,
          priceId,
          durationMultiplier,
        });
        form.setValue('promotionTier', result.promotionTier, {
          shouldDirty: false,
          shouldTouch: false,
        });
        form.setValue('priceId', priceId, { shouldDirty: false, shouldTouch: false });
        form.setValue('durationMultiplier', durationMultiplier, {
          shouldDirty: false,
          shouldTouch: false,
        });
        setPaymentStatus(result.paymentStatus);
        setLastSavedAt(result.paidAt ?? null);
        setAutoSaveState('saved');
        setAutoSaveError(null);
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
    if (nextStatus === 'published' && paymentStatus !== 'paid') {
      setAutoSaveState('error');
      setAutoSaveError('Complete the payment step before publishing.');
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
  const selectedMultiplier = Number(watchedValues.durationMultiplier ?? 1);
  const totalRuntimeMonths = selectedPlan
    ? selectedPlan.baseDurationMonths * selectedMultiplier
    : null;
  const totalPriceLabel = selectedPlan
    ? formatCurrencyValue(
        selectedPlan.amount * selectedMultiplier,
        selectedPlan.currency,
        locale
      )
    : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {mode === 'edit' ? tWizard('heading.edit') : tWizard('heading.create')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{tWizard('progressNote')}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span
            className={
              status === 'published'
                ? 'rounded-full bg-emerald-50 px-3 py-1 text-emerald-600'
                : 'rounded-full bg-slate-100 px-3 py-1 text-slate-600'
            }
          >
            {status === 'published' ? tWizard('status.published') : tWizard('status.draft')}
          </span>
          {autoSaveState === 'saving' ? (
            <span className="flex items-center gap-1 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </span>
          ) : autoSaveState === 'error' && autoSaveError ? (
            <span className="text-rose-500">{autoSaveError}</span>
          ) : savedAtLabel ? (
            <span className="text-slate-400">
              {tWizard('savedAt', { values: { time: savedAtLabel } })}
            </span>
          ) : null}
        </div>
      </div>

      <ListingStepper
        steps={stepsWithTranslations}
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
                      <FormLabel>{tf('title.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('title.placeholder')} {...field} />
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
                      <FormLabel>{tf('propertyType.label')}</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={tf('propertyType.placeholder')} />
                          </SelectTrigger>
                          <SelectContent align="start">
                            {PROPERTY_TYPES.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {tWizard(`options.propertyType.${option.value}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                      <FormLabel>{tf('transactionType.label')}</FormLabel>
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
                              {tWizard(`options.transactionType.${option.value}`)}
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
                    <FormLabel>{tf('description.label')}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={tf('description.placeholder')}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{tf('description.hint')}</span>
                      <span
                        className={cn(
                          (field.value?.length ?? 0) > 5000 ? 'text-rose-600' : 'text-slate-400'
                        )}
                      >
                        {(field.value?.length ?? 0)}/{5000}
                      </span>
                    </div>
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
                      <FormLabel>{tf('street.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('street.placeholder')} {...field} />
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
                      <FormLabel>{tf('city.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('city.placeholder')} {...field} />
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
                      <FormLabel>{tf('postalCode.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('postalCode.placeholder')} {...field} />
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
                      <FormLabel>{tf('country.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('country.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {(
                  [
                    { name: 'bedrooms', label: tf('bedrooms.label') },
                    { name: 'bathrooms', label: tf('bathrooms.label') },
                    { name: 'parkingSpaces', label: tf('parkingSpaces.label') },
                    { name: 'area', label: tf('area.label') },
                    { name: 'lotArea', label: tf('lotArea.label') },
                    { name: 'yearBuilt', label: tf('yearBuilt.label') },
                    { name: 'floor', label: tf('floor.label') },
                    { name: 'totalFloors', label: tf('totalFloors.label') },
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
                      <FormLabel>{tf('energyClass.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={tf('energyClass.placeholder')} {...field} />
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
                        <FormLabel>{tf('latitude.label')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                            placeholder={tf('latitude.placeholder')}
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
                        <FormLabel>{tf('longitude.label')}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.000001"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? null : Number(value));
                            }}
                            placeholder={tf('longitude.placeholder')}
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

          {currentStep === 'finishing' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
                <Controller
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('price.label')}</FormLabel>
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
                      <FormLabel>{tf('currency.label')}</FormLabel>
                      <FormControl>
                        <Select value={field.value ?? 'EUR'} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder={tf('currency.placeholder')} />
                          </SelectTrigger>
                          <SelectContent align="start">
                            <SelectItem value="EUR">{tf('currency.eur')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('contactEmail.label')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={tf('contactEmail.placeholder')}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tf('contactPhone.label')}</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder={tf('contactPhone.placeholder')}
                          value={field.value ?? ''}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="displayEmail"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                      <div>
                        <FormLabel>{tf('displayEmail.label')}</FormLabel>
                        <p className="text-xs text-slate-500">{tf('displayEmail.help')}</p>
                      </div>
                      <FormControl>
                        <VisibilityToggle checked={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayPhone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3">
                      <div>
                        <FormLabel>{tf('displayPhone.label')}</FormLabel>
                        <p className="text-xs text-slate-500">{tf('displayPhone.help')}</p>
                      </div>
                      <FormControl>
                        <VisibilityToggle checked={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </section>
          )}

          {currentStep === 'payment' && (
            <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Choose a plan</h2>
                  <p className="text-sm text-slate-500">Pick a tier and runtime to publish.</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                      paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-orange-50 text-orange-700'
                    )}
                  >
                    {paymentStatus === 'paid' ? 'Payment complete' : 'Payment required'}
                  </span>
                </div>
              </div>

              {!plans.length ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  No Stripe listing prices found. Add one-time prices with listing_tier metadata to continue.
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => {
                      const selected = watchedValues.priceId === plan.priceId;
                      const compareAt = plan.compareAtCents ?? null;
                      const isOnSale = compareAt != null && compareAt > plan.amount;
                      const basePrice = formatCurrencyValue(plan.amount, plan.currency, locale);
                      const compareAtPrice = compareAt
                        ? formatCurrencyValue(compareAt, plan.currency, locale)
                        : null;
                      const savings =
                        compareAt && compareAt > plan.amount ? compareAt - plan.amount : null;
                      const savingsLabel =
                        savings && savings > 0
                          ? `Save ${formatCurrencyValue(savings, plan.currency, locale)}`
                          : null;
                      return (
                        <button
                          type="button"
                          key={plan.priceId}
                          onClick={() => {
                            form.setValue('priceId', plan.priceId);
                            form.setValue('promotionTier', plan.tier, {
                              shouldDirty: false,
                              shouldTouch: false,
                            });
                            if (
                              !plan.multipliers.includes(
                                Number(watchedValues.durationMultiplier ?? 1)
                              )
                            ) {
                              form.setValue('durationMultiplier', plan.multipliers[0] ?? 1, {
                                shouldDirty: false,
                                shouldTouch: false,
                              });
                            }
                          }}
                          className={cn(
                            'flex h-full flex-col rounded-2xl border p-4 text-left transition hover:border-slate-300',
                            selected ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                              <p className="text-xs text-slate-500">
                                {formatDurationLabel(plan.baseDurationMonths)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium uppercase text-slate-700">
                                {plan.tier}
                              </div>
                              {isOnSale && (plan.saleBadge || compareAtPrice) ? (
                                <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700 animate-[pulse_1.5s_ease-in-out_infinite]">
                                  {plan.saleBadge ?? 'Sale'}
                                </div>
                              ) : null}
                            </div>
                          </div>
                          <div className="mt-3 flex items-baseline gap-2">
                            {isOnSale && compareAtPrice ? (
                              <span className="relative text-sm text-slate-400 line-through">
                                {compareAtPrice}
                              </span>
                            ) : null}
                            <p className="text-2xl font-semibold text-slate-900">
                              {basePrice}
                              <span className="text-xs font-normal text-slate-500">
                                {' '}
                                / {formatDurationLabel(plan.baseDurationMonths)}
                              </span>
                            </p>
                          </div>
                          {savingsLabel ? (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                              {savingsLabel}
                            </div>
                          ) : null}
                          {isOnSale && plan.saleNote ? (
                            <p className="mt-1 text-[11px] text-amber-700">{plan.saleNote}</p>
                          ) : null}
                          <ul className="mt-3 space-y-2 text-sm text-slate-600">
                            {(plan.perks.length
                              ? plan.perks
                              : [`Includes ${formatDurationLabel(plan.baseDurationMonths)} runtime`]
                            ).map((perk) => (
                              <li key={perk} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                <span>{perk}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-auto pt-4 text-xs text-slate-500">
                            {selected ? 'Selected' : 'Click to select this plan'}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedPlan ? (
                    <div className="mt-6 rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Duration & pricing
                          </h3>
                          <p className="text-xs text-slate-500">
                            Choose how long the listing runs; price multiplies automatically.
                          </p>
                        </div>
                        {totalPriceLabel ? (
                          <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
                            {totalPriceLabel}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedPlan.multipliers.map((multiplier) => {
                          const runtime = multiplier * selectedPlan.baseDurationMonths;
                          const priceLabel = formatCurrencyValue(
                            selectedPlan.amount * multiplier,
                            selectedPlan.currency,
                            locale
                          );
                          const isSelected = multiplier === selectedMultiplier;
                          return (
                            <button
                              key={`${selectedPlan.priceId}-${multiplier}`}
                              type="button"
                              className={cn(
                                'rounded-full border px-4 py-2 text-sm transition',
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
                              )}
                              onClick={() => form.setValue('durationMultiplier', multiplier)}
                            >
                              {formatDurationLabel(runtime)} • {priceLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </>
              )}

              <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-sm text-slate-500">
                  Payment unlocks publishing for this listing. You can change tiers anytime before payment and
                  renew after expiry.
                </p>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <Button
                    type="button"
                    variant={paymentStatus === 'paid' ? 'outline' : 'default'}
                    disabled={paymentStatus === 'paid' || isPaying || !listingId || !plans.length}
                    onClick={() => handleCompletePayment()}
                    className="rounded-full"
                  >
                    {isPaying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {paymentStatus === 'paid' ? 'Payment completed' : 'Pay & unlock publishing'}
                  </Button>
                  {!listingId && (
                    <span className="text-xs text-orange-600 md:ml-3">
                      Save earlier steps first to generate a listing ID.
                    </span>
                  )}
                  {paymentStatus !== 'paid' && (
                    <span className="text-xs text-slate-500 md:ml-3">
                      Prices are loaded from Stripe. On success we mark this listing as paid for the selected
                      runtime.
                    </span>
                  )}
                </div>
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
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Payment & plan</h3>
                  <dl className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-500">Selected tier</dt>
                      <dd className="capitalize">{form.watch('promotionTier')}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-500">Payment</dt>
                      <dd
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium',
                          paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-orange-50 text-orange-700'
                        )}
                      >
                        {paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </dd>
                    </div>
                    {paymentStatus !== 'paid' && (
                      <div className="text-xs text-orange-600">
                        Complete payment in the previous step to enable publishing.
                      </div>
                    )}
                  </dl>
                </div>
                <div className="rounded-2xl border border-slate-100 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">Contact preferences</h3>
                  <dl className="mt-3 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-500">Email</dt>
                      <dd>
                        {watchedValues.displayEmail
                          ? watchedValues.contactEmail || user?.email || 'Account email'
                          : 'Hidden'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="font-medium text-slate-500">Phone</dt>
                      <dd>
                        {watchedValues.displayPhone
                          ? watchedValues.contactPhone || user?.phoneNumber || 'Not provided'
                          : 'Hidden'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => handlePublishToggle('published')}
                  disabled={!listingId || isStatusUpdating || paymentStatus !== 'paid'}
                  className="rounded-full"
                >
                  {isStatusUpdating && status !== 'published' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {tWizard('actions.publish')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePublishToggle('draft')}
                  disabled={!listingId || isStatusUpdating}
                  className="rounded-full"
                >
                  {isStatusUpdating && status === 'published' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {tWizard('actions.saveDraft')}
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
              <ArrowLeft className="mr-2 h-4 w-4" /> {tWizard('actions.previous')}
            </Button>
            <div className="flex gap-3">
              {!isLastStep && (
                <Button
                  type="button"
                  onClick={() => navigateToStep('next')}
                  disabled={isSavingDraft || (currentStep === 'media' && !listingId)}
                  className="rounded-full"
                >
                  {tWizard('actions.next')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
