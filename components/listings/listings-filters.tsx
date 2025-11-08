'use client';

import { FormEvent, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

type Option = {
  value: string;
  label: string;
};

type ListingsFiltersProps = {
  copy: {
    title: string;
    transaction: string;
    propertyType: string;
    priceMin: string;
    priceMax: string;
    bedrooms: string;
    bathrooms: string;
    apply: string;
    reset: string;
    mobileToggle: string;
  };
  propertyTypes: Option[];
  transactionTypes: Option[];
};

export function ListingsFilters({
  copy,
  propertyTypes,
  transactionTypes,
}: ListingsFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const next = new URLSearchParams(params.toString());

    updateParam(next, 'type', formData.get('type'));
    updateParam(next, 'transaction', formData.get('transaction'));
    updateParam(next, 'minPrice', formData.get('minPrice'));
    updateParam(next, 'maxPrice', formData.get('maxPrice'));
    updateParam(next, 'beds', formData.get('beds'));
    updateParam(next, 'baths', formData.get('baths'));

    next.delete('page');

    setMobileOpen(false);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleReset = () => {
    const next = new URLSearchParams(params.toString());
    ['type', 'transaction', 'minPrice', 'maxPrice', 'beds', 'baths', 'page'].forEach((key) =>
      next.delete(key)
    );
    setMobileOpen(false);
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const defaultValues = {
    type: params.get('type') ?? 'all',
    transaction: params.get('transaction') ?? 'all',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    beds: params.get('beds') ?? '',
    baths: params.get('baths') ?? '',
  };

  return (
    <div className="lg:sticky lg:top-6">
      <button
        type="button"
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 lg:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-expanded={mobileOpen}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {copy.mobileToggle}
      </button>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm',
          mobileOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">{copy.title}</h2>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600"
          >
            {copy.reset}
          </button>
        </div>

        <div className="space-y-4">
          <LabelledSelect
            label={copy.transaction}
            name="transaction"
            defaultValue={defaultValues.transaction}
            options={transactionTypes}
          />
          <LabelledSelect
            label={copy.propertyType}
            name="type"
            defaultValue={defaultValues.type}
            options={propertyTypes}
          />
          <LabelledInput
            label={copy.priceMin}
            name="minPrice"
            defaultValue={defaultValues.minPrice}
            inputMode="numeric"
          />
          <LabelledInput
            label={copy.priceMax}
            name="maxPrice"
            defaultValue={defaultValues.maxPrice}
            inputMode="numeric"
          />
          <LabelledInput
            label={copy.bedrooms}
            name="beds"
            defaultValue={defaultValues.beds}
            inputMode="numeric"
          />
          <LabelledInput
            label={copy.bathrooms}
            name="baths"
            defaultValue={defaultValues.baths}
            inputMode="numeric"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {copy.apply}
        </button>
      </form>
    </div>
  );
}

function LabelledSelect({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Option[];
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function LabelledInput({
  label,
  name,
  defaultValue,
  inputMode,
}: {
  label: string;
  name: string;
  defaultValue: string;
  inputMode?: 'numeric';
}) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        inputMode={inputMode}
        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-slate-400 focus:outline-none"
      />
    </label>
  );
}

function updateParam(params: URLSearchParams, key: string, value: FormDataEntryValue | null) {
  const stringValue =
    typeof value === 'string'
      ? value.trim()
      : typeof value === 'number'
      ? value.toString()
      : '';

  if (!stringValue || stringValue === 'all') {
    params.delete(key);
  } else {
    params.set(key, stringValue);
  }
}
