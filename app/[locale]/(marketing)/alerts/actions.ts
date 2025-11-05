'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  createAlertForUser,
  deleteAlertForUser,
  updateAlertForUser,
  PROPERTY_TYPE_OPTIONS,
  TRANSACTION_TYPES,
  type AlertInput,
  type PropertyTypeOption,
  type TransactionTypeOption
} from '@/lib/db/alerts';
import { validatedActionWithUser, type ActionState } from '@/lib/auth/middleware';
import { isLocale } from '@/lib/i18n/config';

const baseSchema = z.object({
  title: z.string().max(120),
  transactionType: z.string(),
  propertyType: z.string().optional(),
  minBudget: z.string().optional(),
  maxBudget: z.string().optional(),
  location: z.string().max(120).optional(),
  radiusKm: z.string().optional(),
  notifyEmail: z.string().optional(),
  notifyPush: z.string().optional()
});

const updateSchema = baseSchema.extend({
  alertId: z.string()
});

const deleteSchema = z.object({
  alertId: z.string()
});

export type AlertFormValues = {
  title: string;
  transactionType: string;
  propertyType: string;
  minBudget: string;
  maxBudget: string;
  location: string;
  radiusKm: string;
  notifyEmail: boolean;
  notifyPush: boolean;
};

export type AlertFormState = ActionState & {
  values?: AlertFormValues;
};

type BaseSchemaInput = z.infer<typeof baseSchema>;

type ParsedResult =
  | { error: string; values: AlertFormValues }
  | { input: AlertInput; values: AlertFormValues };

function getAlertsPath(formData: FormData) {
  const locale = formData.get('locale');
  if (typeof locale === 'string' && isLocale(locale)) {
    return `/${locale}/alerts`;
  }
  return '/alerts';
}

function toFormValues(data: BaseSchemaInput): AlertFormValues {
  const propertyTypeRaw = (data.propertyType ?? '').trim();
  const normalizedPropertyType = PROPERTY_TYPE_OPTIONS.includes(
    propertyTypeRaw as PropertyTypeOption
  )
    ? propertyTypeRaw
    : '';

  return {
    title: (data.title ?? '').trim(),
    transactionType: data.transactionType ?? TRANSACTION_TYPES[0],
    propertyType: normalizedPropertyType,
    minBudget: (data.minBudget ?? '').trim(),
    maxBudget: (data.maxBudget ?? '').trim(),
    location: (data.location ?? '').trim(),
    radiusKm: (data.radiusKm ?? '').trim(),
    notifyEmail:
      data.notifyEmail === 'on' ||
      data.notifyEmail === 'true' ||
      data.notifyEmail === '1',
    notifyPush:
      data.notifyPush === 'on' ||
      data.notifyPush === 'true' ||
      data.notifyPush === '1'
  };
}

function parseOptionalInt(
  value: string
): { value: number | null; raw: string; error: boolean } {
  const raw = value.trim();
  if (!raw) {
    return { value: null, raw: '', error: false };
  }
  if (!/^\d+$/.test(raw)) {
    return { value: null, raw, error: true };
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return { value: null, raw, error: true };
  }
  return { value: parsed, raw, error: false };
}

function buildAlertInput(data: BaseSchemaInput): ParsedResult {
  const values = toFormValues(data);
  const title = values.title.trim();

  if (!title) {
    return { error: 'titleRequired', values };
  }

  const transactionTypeRaw = data.transactionType;
  const transactionType = TRANSACTION_TYPES.includes(
    transactionTypeRaw as TransactionTypeOption
  )
    ? (transactionTypeRaw as TransactionTypeOption)
    : null;

  if (!transactionType) {
    return { error: 'invalidTransaction', values };
  }
  values.transactionType = transactionType;

  const propertyType = values.propertyType
    ? (values.propertyType as PropertyTypeOption)
    : null;

  const minBudget = parseOptionalInt(values.minBudget);
  if (minBudget.error) {
    values.minBudget = minBudget.raw;
    return { error: 'invalidBudget', values };
  }
  values.minBudget = minBudget.raw;

  const maxBudget = parseOptionalInt(values.maxBudget);
  if (maxBudget.error) {
    values.maxBudget = maxBudget.raw;
    return { error: 'invalidBudget', values };
  }
  values.maxBudget = maxBudget.raw;

  if (
    minBudget.value !== null &&
    maxBudget.value !== null &&
    minBudget.value > maxBudget.value
  ) {
    return { error: 'minGreaterThanMax', values };
  }

  const radius = parseOptionalInt(values.radiusKm);
  if (radius.error) {
    values.radiusKm = radius.raw;
    return { error: 'invalidRadius', values };
  }
  values.radiusKm = radius.raw;

  const city = values.location ? values.location : null;

  const input: AlertInput = {
    title,
    transactionType,
    propertyType,
    minBudget: minBudget.value,
    maxBudget: maxBudget.value,
    city,
    radiusKm: radius.value,
    notifyEmail: values.notifyEmail,
    notifyPush: values.notifyPush
  };

  return { input, values };
}

export const createAlert = validatedActionWithUser(
  baseSchema,
  async (data, formData, user): Promise<AlertFormState> => {
    const parsed = buildAlertInput(data);
    if ('error' in parsed) {
      return { error: parsed.error, values: parsed.values };
    }

    try {
      await createAlertForUser(user.id, parsed.input);
    } catch (error) {
      console.error('Failed to create alert', error);
      return { error: 'unknown', values: parsed.values };
    }

    revalidatePath(getAlertsPath(formData));
    return { success: 'created' };
  }
);

export const updateAlert = validatedActionWithUser(
  updateSchema,
  async (data, formData, user): Promise<AlertFormState> => {
    const { alertId, ...rest } = data;
    const parsed = buildAlertInput(rest);
    if ('error' in parsed) {
      return { error: parsed.error, values: parsed.values };
    }

    const id = Number.parseInt(alertId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return { error: 'notFound', values: parsed.values };
    }

    const updated = await updateAlertForUser(user.id, id, parsed.input);
    if (!updated) {
      return { error: 'notFound', values: parsed.values };
    }

    revalidatePath(getAlertsPath(formData));
    return { success: 'updated' };
  }
);

export const deleteAlert = validatedActionWithUser(
  deleteSchema,
  async (data, formData, user): Promise<ActionState> => {
    const id = Number.parseInt(data.alertId, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return { error: 'notFound' };
    }

    const deleted = await deleteAlertForUser(user.id, id);
    if (!deleted) {
      return { error: 'notFound' };
    }

    revalidatePath(getAlertsPath(formData));
    return { success: 'deleted' };
  }
);
