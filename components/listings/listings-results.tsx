'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bath, BedDouble, ChevronLeft, ChevronRight, Heart, MapPin, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ListingSummary } from '@/lib/types/listing';
import { cn } from '@/lib/utils';
import { useListingFavorites } from '@/hooks/use-listing-favorites';

type ListingsResultsProps = {
  locale: string;
  listings: ListingSummary[];
  copy: {
    favorite: string;
    favoriteSelected: string;
    view: string;
    stats: {
      beds: string;
      baths: string;
      area: string;
    };
  };
  emptyMessage: string;
  pagination: {
    summary: string;
    previousLabel: string;
    nextLabel: string;
    previousHref: string | null;
    nextHref: string | null;
  };
};

export function ListingsResults({
  locale,
  listings,
  copy,
  emptyMessage,
  pagination,
}: ListingsResultsProps) {
  const { favorites, toggleFavorite } = useListingFavorites({ locale });
  const [activeSlides, setActiveSlides] = useState<Record<string, number>>({});

  const changeSlide = (listingId: string, delta: number, length: number) => {
    setActiveSlides((prev) => {
      const current = prev[listingId] ?? 0;
      const nextIndex = (current + delta + length) % length;
      return { ...prev, [listingId]: nextIndex };
    });
  };

  return (
    <div className="space-y-6">
      {listings.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        listings.map((listing) => {
          const gallery = listing.gallery.length > 0
            ? listing.gallery
            : [
              {
                id: listing.id,
                url: listing.mainImage,
                alt: listing.title,
                isMain: true,
              },
            ];

          const activeIndex = activeSlides[listing.id] ?? 0;
          const activeImage = gallery[activeIndex];
          const isFavorite = favorites.has(listing.id);

          const stats = [
            { label: copy.stats.beds, value: formatStat(listing.bedrooms), icon: BedDouble },
            { label: copy.stats.baths, value: formatStat(listing.bathrooms), icon: Bath },
            { label: copy.stats.area, value: listing.areaSqm ? `${listing.areaSqm} m²` : '—', icon: Ruler },
          ];

          const priceLabel = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: listing.currency ?? 'EUR',
            maximumFractionDigits: 0,
          }).format(listing.price);

          return (
            <article
              key={listing.id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                {activeImage ? (
                  <Image
                    src={activeImage.url}
                    alt={activeImage.alt ?? listing.title}
                    fill
                    sizes="(min-width: 1024px) 600px, 100vw"
                    className="object-cover"
                    priority={false}
                  />
                ) : null}
                {gallery.length > 1 ? (
                  <>
                    <button
                      type="button"
                      className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm transition hover:bg-white"
                      onClick={() => changeSlide(listing.id, -1, gallery.length)}
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-sm transition hover:bg-white"
                      onClick={() => changeSlide(listing.id, 1, gallery.length)}
                      aria-label="Next photo"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleFavorite(listing.id)}
                  aria-pressed={isFavorite}
                  aria-label={isFavorite ? copy.favoriteSelected : copy.favorite}
                  className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-md transition hover:bg-white"
                >
                  <Heart
                    className={cn('h-5 w-5', isFavorite && 'fill-rose-500 text-rose-500')}
                    aria-hidden="true"
                  />
                </button>
                {gallery.length > 1 ? (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1">
                    {gallery.map((image, index) => (
                      <span
                        key={image.id}
                        className={cn(
                          'h-1.5 w-6 rounded-full bg-white/60',
                          index === activeIndex && 'bg-white'
                        )}
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{listing.title}</h2>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      {listing.location.city}, {listing.location.country}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{priceLabel}</span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2">
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
                        <span className="font-semibold text-slate-900">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-500">
                    {listing.highlights?.slice(0, 2).join(' • ')}
                  </div>
                  <Button asChild className="rounded-full px-6">
                    <Link href={`/${locale}/${listing.id}`}>{copy.view}</Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })
      )}

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p>{pagination.summary}</p>
        <div className="flex items-center gap-3">
          <PaginationLink href={pagination.previousHref} label={pagination.previousLabel} />
          <PaginationLink href={pagination.nextHref} label={pagination.nextLabel} />
        </div>
      </div>
    </div>
  );
}

function PaginationLink({ href, label }: { href: string | null; label: string }) {
  const className =
    'inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50';

  if (!href) {
    return (
      <button type="button" className={className} disabled>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function formatStat(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return value;
}
