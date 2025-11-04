'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { ListingCard } from '@/components/listings/listing-card';
import { Button } from '@/components/ui/button';
import { useI18n, useTranslations } from '@/lib/i18n/provider';
import type { ListingSummary } from '@/lib/types/listing';

interface FavoritesDashboardProps {
  initialFavorites: ListingSummary[];
  isAuthenticated: boolean;
  signInPath: string;
}

type ListingCategoryFilter = ListingSummary['category'] | 'all';

type TrendPoint = {
  date: string;
  value: number;
};

function calculatePriceTrend(favorites: ListingSummary[]): TrendPoint[] {
  if (favorites.length === 0) {
    return [];
  }

  const average =
    favorites.reduce((sum, listing) => sum + listing.price, 0) /
    favorites.length;
  const amplitude = Math.max(average * 0.08, 1);
  const now = new Date();

  return Array.from({ length: 6 }, (_, index) => {
    const monthsAgo = 5 - index;
    const referenceDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthsAgo,
      1
    );

    const variationSeed = favorites.reduce((acc, listing, idx) => {
      const seed = Math.sin((idx + 1) * 0.6 + listing.price * 0.0001);
      return acc + seed;
    }, 0);

    const normalizedSeed = variationSeed / favorites.length;
    const variation = Math.sin(index * 0.9 + normalizedSeed) * amplitude;
    const value = Math.max(0, Math.round(average + variation));

    return {
      date: referenceDate.toISOString(),
      value,
    };
  });
}

function PriceTrendChart({
  data,
  currencyFormatter,
  monthFormatter,
  ariaLabel,
}: {
  data: TrendPoint[];
  currencyFormatter: (value: number) => string;
  monthFormatter: (date: Date) => string;
  ariaLabel: string;
}) {
  if (data.length === 0) {
    return null;
  }

  const width = 360;
  const height = 220;
  const paddingX = 32;
  const paddingY = 28;
  const minValue = Math.min(...data.map((point) => point.value));
  const maxValue = Math.max(...data.map((point) => point.value));
  const range = Math.max(maxValue - minValue, 1);
  const gradientId = `${useId()}-price-trend`;

  const points = data.map((point, index) => {
    const x =
      paddingX +
      (index / Math.max(data.length - 1, 1)) * (width - paddingX * 2);
    const y =
      height -
      paddingY -
      ((point.value - minValue) / range) * (height - paddingY * 2);

    return { ...point, x, y, dateObj: new Date(point.date) };
  });

  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command}${point.x.toFixed(2)},${point.y.toFixed(2)}`;
    })
    .join(' ');

  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(2)},${(
    height - paddingY
  ).toFixed(2)} L${points[0].x.toFixed(2)},${(height - paddingY).toFixed(2)} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(14, 116, 144, 0.35)" />
          <stop offset="100%" stopColor="rgba(14, 116, 144, 0.05)" />
        </linearGradient>
      </defs>
      <rect
        x={paddingX}
        y={paddingY}
        width={width - paddingX * 2}
        height={height - paddingY * 2}
        rx={12}
        className="fill-slate-50"
      />
      <path d={areaPath} fill={`url(#${gradientId})`} className="stroke-none" />
      <path
        d={linePath}
        className="stroke-sky-600"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((point) => (
        <g key={point.date}>
          <circle
            cx={point.x}
            cy={point.y}
            r={5}
            className="fill-white stroke-sky-600"
            strokeWidth={2}
          >
            <title>
              {monthFormatter(point.dateObj)} — {currencyFormatter(point.value)}
            </title>
          </circle>
        </g>
      ))}
      {points.map((point) => (
        <text
          key={`${point.date}-label`}
          x={point.x}
          y={height - paddingY / 2}
          textAnchor="middle"
          className="fill-slate-500 text-[10px] tracking-wide"
        >
          {monthFormatter(point.dateObj)}
        </text>
      ))}
    </svg>
  );
}

export function FavoritesDashboard({
  initialFavorites,
  isAuthenticated,
  signInPath,
}: FavoritesDashboardProps) {
  const t = useTranslations('favorites');
  const { locale } = useI18n();
  const [favorites, setFavorites] = useState(initialFavorites);
  const [filter, setFilter] = useState<ListingCategoryFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(favorites.map((item) => item.category))).sort();
  }, [favorites]);

  const filteredFavorites = useMemo(() => {
    if (filter === 'all') {
      return favorites;
    }

    return favorites.filter((favorite) => favorite.category === filter);
  }, [favorites, filter]);

  const formatter = useMemo(() => {
    const localeTag =
      locale === 'fr' ? 'fr-LU' : locale === 'de' ? 'de-LU' : 'en-LU';
    return new Intl.NumberFormat(localeTag, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const monthFormatter = useMemo(() => {
    const localeTag =
      locale === 'fr' ? 'fr-LU' : locale === 'de' ? 'de-LU' : 'en-LU';
    return new Intl.DateTimeFormat(localeTag, { month: 'short' });
  }, [locale]);

  const trendData = useMemo(
    () => calculatePriceTrend(filteredFavorites),
    [filteredFavorites]
  );

  const averagePrice = useMemo(() => {
    if (filteredFavorites.length === 0) {
      return 0;
    }

    const total = filteredFavorites.reduce(
      (sum, listing) => sum + listing.price,
      0
    );
    return Math.round(total / filteredFavorites.length);
  }, [filteredFavorites]);

  const favoritesCountLabel = t('favoritesCount', {
    values: { count: favorites.length },
  });

  const handleToggleFavorite = async (listingId: string) => {
    setError(null);
    const numericId = Number.parseInt(listingId, 10);
    if (!Number.isFinite(numericId)) {
      return;
    }

    const wasFavorite = favorites.some((favorite) => favorite.id === listingId);
    const previous = favorites;
    setPendingId(listingId);

    if (wasFavorite) {
      setFavorites((current) =>
        current.filter((favorite) => favorite.id !== listingId)
      );
    }

    try {
      const response = await fetch('/api/favorites', {
        method: wasFavorite ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId: numericId }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!wasFavorite) {
        const payload = (await response.json()) as ListingSummary;
        setFavorites((current) => {
          if (current.some((favorite) => favorite.id === payload.id)) {
            return current;
          }

          return [...current, payload];
        });
      }
    } catch (err) {
      setFavorites(previous);
      setError(t('removeError'));
    } finally {
      setPendingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
          {t('authRequiredTitle')}
        </h1>
        <p className="max-w-xl text-base text-slate-600 md:text-lg">
          {t('authRequiredDescription')}
        </p>
        <Button asChild size="lg" className="rounded-full px-6">
          <Link href={signInPath}>{t('authRequiredCta')}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          {favoritesCountLabel}
        </span>
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
          {t('pageTitle')}
        </h1>
        <p className="max-w-2xl text-base text-slate-600">
          {t('pageSubtitle')}
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[2fr,minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          {favorites.length > 0 ? (
            <>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  {t('quickFiltersLabel')}
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setFilter('all')}
                  >
                    {t('filters.all')}
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={filter === category ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setFilter(category)}
                    >
                      {t(`filters.${category}`)}
                    </Button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                {filteredFavorites.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorite
                    onToggleFavorite={handleToggleFavorite}
                    isFavoriteDisabled={pendingId === listing.id}
                  />
                ))}
              </div>

              {filteredFavorites.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {t('emptyTitle')}
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {t('emptyDescription')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <h2 className="text-lg font-semibold text-slate-900">
                {t('emptyTitle')}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {t('emptyDescription')}
              </p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-slate-900">
              {t('trendHeading')}
            </h2>
            <p className="text-sm text-slate-600">{t('trendDescription')}</p>
          </div>

          {trendData.length > 1 ? (
            <PriceTrendChart
              data={trendData}
              currencyFormatter={(value) => formatter.format(value)}
              monthFormatter={(date) => monthFormatter.format(date)}
              ariaLabel={t('trendHeading')}
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500">
              {t('trendEmpty')}
            </div>
          )}

          <dl className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-4 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t('avgPriceLabel')}
              </dt>
              <dd className="text-lg font-semibold text-slate-900">
                {formatter.format(averagePrice)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                {t('favoritesCountLabel')}
              </dt>
              <dd className="text-lg font-semibold text-slate-900">
                {favoritesCountLabel}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
