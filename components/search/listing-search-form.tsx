'use client';

import { FormEvent, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Home,
  MapPin,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n/provider';

const PROPERTY_TYPES = [
  'all',
  'apartment',
  'house',
  'duplex',
  'penthouse',
  'office',
  'land'
] as const;

export function ListingSearchForm() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useTranslations('search');
  const [showExtended, setShowExtended] = useState(false);

  const defaultValues = useMemo(() => {
    const entries: Record<string, string> = {};
    params.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }, [params]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextParams = new URLSearchParams(params.toString());

    ['q', 'location', 'type', 'minPrice', 'maxPrice', 'beds', 'baths'].forEach(
      (key) => {
        const value = (formData.get(key) as string | null)?.trim();
        if (!value) {
          nextParams.delete(key);
        } else {
          nextParams.set(key, value);
        }
      }
    );

    router.push(`${pathname}?${nextParams.toString()}`);
  };

  return (
    <form
      id="search"
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5"
    >
      <div className="grid gap-4 md:grid-cols-[1.5fr_1fr_1fr]">
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            name="q"
            defaultValue={defaultValues.q}
            placeholder={t('keyword')}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <input
            name="location"
            defaultValue={defaultValues.location}
            placeholder={t('location')}
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <Home className="h-4 w-4 text-slate-400" aria-hidden="true" />
          <select
            name="type"
            defaultValue={defaultValues.type ?? 'all'}
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
          >
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showExtended && (
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
            {t('minPrice')}
            <input
              name="minPrice"
              defaultValue={defaultValues.minPrice}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-transparent text-base font-medium text-slate-900 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
            {t('maxPrice')}
            <input
              name="maxPrice"
              defaultValue={defaultValues.maxPrice}
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full bg-transparent text-base font-medium text-slate-900 focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
              {t('beds')}
              <input
                name="beds"
                defaultValue={defaultValues.beds}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-transparent text-base font-medium text-slate-900 focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
              {t('baths')}
              <input
                name="baths"
                defaultValue={defaultValues.baths}
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full bg-transparent text-base font-medium text-slate-900 focus:outline-none"
              />
            </label>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setShowExtended((prev) => !prev)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {showExtended ? t('fewerFilters') : t('moreFilters')}
        </button>
        <Button type="submit" className="rounded-full px-6" size="lg">
          {t('submit')}
        </Button>
      </div>
    </form>
  );
}
