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
