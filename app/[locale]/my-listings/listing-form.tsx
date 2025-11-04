'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ListingFormField, type ListingFormState } from './actions';
import type { ListingStatus } from '@/lib/types/listing';

export type ListingFormValues = {
  title?: string;
  description?: string | null;
  propertyType?: string;
  transactionType?: 'sale' | 'rent';
  status?: ListingStatus;
  price?: number;
  currency?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  street?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
};

export type ListingFormCopy = {
  fields: Record<
    Exclude<ListingFormField, 'status' | 'transactionType'>,
    { label: string; placeholder?: string }
  > & {
    status: { label: string };
  };
  propertyTypeOptions: Array<{ value: string; label: string }>;
  statusOptions: Array<{ value: ListingStatus; label: string }>;
  transactionType: {
    label: string;
    sale: string;
    rent: string;
  };
  buttons: {
    cancel: string;
    submit: string;
    submitting: string;
  };
  statusHelp?: string;
};

export type ListingFormProps = {
  action: (
    state: ListingFormState,
    formData: FormData
  ) => Promise<ListingFormState>;
  locale: string;
  copy: ListingFormCopy;
  listingId?: number;
  initialValues?: ListingFormValues;
  onCancel?: () => void;
  onSuccess?: () => void;
  showStatus?: boolean;
};

function getValue(
  field: ListingFormField,
  state: ListingFormState,
  initialValues?: ListingFormValues
) {
  if (state.fields[field] !== undefined) {
    return state.fields[field] ?? '';
  }

  if (!initialValues) {
    return '';
  }

  const value = initialValues[field as keyof ListingFormValues];
  if (value == null) {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return value;
}

export function ListingForm({
  action,
  locale,
  copy,
  listingId,
  initialValues,
  onCancel,
  onSuccess,
  showStatus = true,
}: ListingFormProps) {
  const initialListingFormState: ListingFormState = { fields: {} };
  const [state, formAction, pending] = useActionState(action, initialListingFormState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [onSuccess, router, state.success]);

  return (
    <form className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm" action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      {listingId != null ? (
        <input type="hidden" name="listingId" value={listingId} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="title" className="text-sm font-medium text-slate-700">
            {copy.fields.title.label}
          </Label>
          <Input
            id="title"
            name="title"
            required
            maxLength={180}
            placeholder={copy.fields.title.placeholder}
            defaultValue={getValue('title', state, initialValues)}
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="description" className="text-sm font-medium text-slate-700">
            {copy.fields.description.label}
          </Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder={copy.fields.description.placeholder}
            defaultValue={getValue('description', state, initialValues)}
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <Label htmlFor="propertyType" className="text-sm font-medium text-slate-700">
            {copy.fields.propertyType.label}
          </Label>
          <select
            id="propertyType"
            name="propertyType"
            required
            defaultValue={getValue('propertyType', state, initialValues) || copy.propertyTypeOptions[0]?.value || ''}
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {copy.propertyTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="transactionType" className="text-sm font-medium text-slate-700">
            {copy.transactionType.label}
          </Label>
          <select
            id="transactionType"
            name="transactionType"
            required
            defaultValue={getValue('transactionType', state, initialValues) || 'sale'}
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <option value="sale">{copy.transactionType.sale}</option>
            <option value="rent">{copy.transactionType.rent}</option>
          </select>
        </div>

        {showStatus ? (
          <div>
            <Label htmlFor="status" className="text-sm font-medium text-slate-700">
              {copy.fields.status.label}
            </Label>
            <select
              id="status"
              name="status"
              required
              defaultValue={getValue('status', state, initialValues) || 'draft'}
              className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              {copy.statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {copy.statusHelp ? (
              <p className="mt-1 text-xs text-slate-500">{copy.statusHelp}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <Label htmlFor="price" className="text-sm font-medium text-slate-700">
            {copy.fields.price.label}
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            min={0}
            step="1"
            required
            placeholder={copy.fields.price.placeholder}
            defaultValue={getValue('price', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="currency" className="text-sm font-medium text-slate-700">
            {copy.fields.currency.label}
          </Label>
          <Input
            id="currency"
            name="currency"
            required
            maxLength={3}
            placeholder={copy.fields.currency.placeholder}
            defaultValue={getValue('currency', state, initialValues) || 'EUR'}
            className="uppercase"
          />
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-medium text-slate-700">
            {copy.fields.city.label}
          </Label>
          <Input
            id="city"
            name="city"
            required
            maxLength={100}
            placeholder={copy.fields.city.placeholder}
            defaultValue={getValue('city', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="postalCode" className="text-sm font-medium text-slate-700">
            {copy.fields.postalCode.label}
          </Label>
          <Input
            id="postalCode"
            name="postalCode"
            required
            maxLength={12}
            placeholder={copy.fields.postalCode.placeholder}
            defaultValue={getValue('postalCode', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="country" className="text-sm font-medium text-slate-700">
            {copy.fields.country.label}
          </Label>
          <Input
            id="country"
            name="country"
            required
            maxLength={2}
            placeholder={copy.fields.country.placeholder}
            defaultValue={getValue('country', state, initialValues) || 'LU'}
            className="uppercase"
          />
        </div>

        <div>
          <Label htmlFor="street" className="text-sm font-medium text-slate-700">
            {copy.fields.street.label}
          </Label>
          <Input
            id="street"
            name="street"
            maxLength={180}
            placeholder={copy.fields.street.placeholder}
            defaultValue={getValue('street', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="bedrooms" className="text-sm font-medium text-slate-700">
            {copy.fields.bedrooms.label}
          </Label>
          <Input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min={0}
            step="1"
            placeholder={copy.fields.bedrooms.placeholder}
            defaultValue={getValue('bedrooms', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="bathrooms" className="text-sm font-medium text-slate-700">
            {copy.fields.bathrooms.label}
          </Label>
          <Input
            id="bathrooms"
            name="bathrooms"
            type="number"
            min={0}
            step="1"
            placeholder={copy.fields.bathrooms.placeholder}
            defaultValue={getValue('bathrooms', state, initialValues)}
          />
        </div>

        <div>
          <Label htmlFor="area" className="text-sm font-medium text-slate-700">
            {copy.fields.area.label}
          </Label>
          <Input
            id="area"
            name="area"
            type="number"
            min={0}
            step="1"
            placeholder={copy.fields.area.placeholder}
            defaultValue={getValue('area', state, initialValues)}
          />
        </div>
      </div>

      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={pending}
          >
            {copy.buttons.cancel}
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? copy.buttons.submitting : copy.buttons.submit}
        </Button>
      </div>
    </form>
  );
}
