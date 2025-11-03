'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Heart,
  MapPin
} from 'lucide-react';
import type { ListingSummary } from '@/lib/types/listing';
import { useI18n, useTranslations } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: ListingSummary;
  isFavorite: boolean;
  onToggleFavorite: (listingId: string) => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: ListingCardProps) {
  const t = useTranslations('listings');
  const { locale } = useI18n();
  const [animating, setAnimating] = useState(false);

  const formatter = useMemo(() => {
    const localeTag = locale === 'fr' ? 'fr-LU' : locale === 'de' ? 'de-LU' : 'en-LU';
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    });
  }, [locale]);

  useEffect(() => {
    if (isFavorite) {
      setAnimating(true);
      const timer = setTimeout(() => setAnimating(false), 420);
      return () => clearTimeout(timer);
    }
    setAnimating(false);
  }, [isFavorite]);

  const formattedPrice = formatter.format(listing.price);
  const priceLabel =
    listing.priceType === 'rent'
      ? t('pricePerMonth', { values: { price: formattedPrice } })
      : t('price', { values: { price: formattedPrice } });

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <div className="relative h-60 w-full overflow-hidden">
          <Image
            src={listing.mainImage}
            alt={listing.title}
            fill
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            sizes="(min-width: 1024px) 400px, 100vw"
            priority={false}
            loading='eager'
          />
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite(listing.id)}
          aria-pressed={isFavorite}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-md backdrop-blur transition hover:bg-white"
        >
          <Heart
            className={cn(
              'h-5 w-5 transition-transform',
              isFavorite && 'fill-rose-500 text-rose-500',
              animating && 'heart-burst'
            )}
            aria-hidden="true"
          />
          <span className="sr-only">Toggle favorite</span>
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{listing.title}</h3>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              <span>
                {listing.location.city}, {listing.location.country}
              </span>
            </div>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white">
            {listing.category}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <BedDouble className="h-4 w-4" aria-hidden="true" />
              {t('beds', { values: { count: listing.bedrooms } })}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="h-4 w-4" aria-hidden="true" />
              {t('baths', { values: { count: listing.bathrooms } })}
            </span>
          </div>
          <span className="text-base font-semibold text-slate-900">{t('area', { values: { value: listing.areaSqm } })}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">{priceLabel}</span>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {t('seeMore')}
          </button>
        </div>
      </div>
    </article>
  );
}
