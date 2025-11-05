import { and, desc, eq } from 'drizzle-orm';
import { db } from './drizzle';
import { alerts, type Alert, type NewAlert } from './schema';

export const PROPERTY_TYPE_OPTIONS = [
  'apartment',
  'house',
  'duplex',
  'penthouse',
  'office',
  'land'
] as const;

export const TRANSACTION_TYPES = ['sale', 'rent'] as const;

export type PropertyTypeOption = (typeof PROPERTY_TYPE_OPTIONS)[number];
export type TransactionTypeOption = (typeof TRANSACTION_TYPES)[number];

export type AlertInput = {
  title: string;
  transactionType: TransactionTypeOption;
  propertyType: PropertyTypeOption | null;
  minBudget: number | null;
  maxBudget: number | null;
  city: string | null;
  radiusKm: number | null;
  notifyEmail: boolean;
  notifyPush: boolean;
};

export type AlertSummary = {
  id: number;
  title: string;
  transactionType: TransactionTypeOption;
  propertyType: PropertyTypeOption | null;
  minBudget: number | null;
  maxBudget: number | null;
  city: string | null;
  radiusKm: number | null;
  notifyEmail: boolean;
  notifyPush: boolean;
  createdAt: string;
  updatedAt: string;
};

function normalizePropertyType(value: string | null): PropertyTypeOption | null {
  if (!value) {
    return null;
  }
  return PROPERTY_TYPE_OPTIONS.includes(value as PropertyTypeOption)
    ? (value as PropertyTypeOption)
    : null;
}

function mapAlert(record: Alert): AlertSummary {
  return {
    id: record.id,
    title: record.title,
    transactionType: (record.transactionType ?? 'sale') as TransactionTypeOption,
    propertyType: normalizePropertyType(record.propertyTypes ?? null),
    minBudget: record.minPrice ?? null,
    maxBudget: record.maxPrice ?? null,
    city: record.city ?? null,
    radiusKm: record.radiusKm ?? null,
    notifyEmail: record.notifyEmail,
    notifyPush: record.notifyPush,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function getAlertsForUser(userId: number): Promise<AlertSummary[]> {
  const records = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.updatedAt));

  return records.map(mapAlert);
}

export async function createAlertForUser(
  userId: number,
  input: AlertInput
): Promise<AlertSummary> {
  const now = new Date();
  const values: NewAlert = {
    userId,
    title: input.title,
    transactionType: input.transactionType,
    propertyTypes: input.propertyType ?? null,
    minPrice: input.minBudget,
    maxPrice: input.maxBudget,
    city: input.city,
    radiusKm: input.radiusKm,
    notifyEmail: input.notifyEmail,
    notifyPush: input.notifyPush,
    updatedAt: now
  };

  const [created] = await db.insert(alerts).values(values).returning();
  if (!created) {
    throw new Error('Failed to create alert');
  }

  return mapAlert(created);
}

export async function updateAlertForUser(
  userId: number,
  alertId: number,
  input: AlertInput
): Promise<AlertSummary | null> {
  const now = new Date();
  const [updated] = await db
    .update(alerts)
    .set({
      title: input.title,
      transactionType: input.transactionType,
      propertyTypes: input.propertyType ?? null,
      minPrice: input.minBudget,
      maxPrice: input.maxBudget,
      city: input.city,
      radiusKm: input.radiusKm,
      notifyEmail: input.notifyEmail,
      notifyPush: input.notifyPush,
      updatedAt: now
    })
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning();

  return updated ? mapAlert(updated) : null;
}

export async function deleteAlertForUser(
  userId: number,
  alertId: number
): Promise<boolean> {
  const [deleted] = await db
    .delete(alerts)
    .where(and(eq(alerts.id, alertId), eq(alerts.userId, userId)))
    .returning({ id: alerts.id });

  return Boolean(deleted);
}
