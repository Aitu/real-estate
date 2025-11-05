import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Bath, BedDouble, CalendarDays, Car, Leaf, Ruler } from 'lucide-react';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { ListingMap } from '@/components/map/listing-map';
import { getListingDetail } from '@/lib/db/listings';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { loadMessages } from '@/lib/i18n/get-messages';
import { getTranslator } from '@/lib/i18n/server';
import { formatCurrency } from '@/lib/i18n/format';

export async function generateMetadata({
  params,
}: {
  params: { locale: string; id: string };
}): Promise<Metadata> {
  const { locale: localeParam, id } = params;

  if (!isLocale(localeParam)) {
    return {};
  }

  const listingId = Number(id);
  if (!Number.isFinite(listingId)) {
    return {};
  }

  const locale = localeParam as Locale;

  const [messages, listing] = await Promise.all([
    loadMessages(locale),
    getListingDetail(listingId),
  ]);

  if (!listing) {
    return {};
  }

  const t = getTranslator(locale, messages, 'listingDetail');
  const description = listing.description ?? t('descriptionFallback');
  const trimmedDescription =
    description.length > 160 ? `${description.slice(0, 157)}…` : description;

  return {
    title: `${listing.title} | LuxNest`,
    description: trimmedDescription,
    alternates: {
      canonical: `/${locale}/listings/${listing.id}`,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale: localeParam, id } = params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const listingId = Number(id);
  if (!Number.isFinite(listingId)) {
    notFound();
  }

  const locale = localeParam as Locale;

  const [messages, listing] = await Promise.all([
    loadMessages(locale),
    getListingDetail(listingId),
  ]);

  if (!listing) {
    notFound();
  }

  const t = getTranslator(locale, messages, 'listingDetail');
  const formattedPrice = formatCurrency(listing.price, {
    locale,
    currency: listing.currency,
  });
  const priceLabel =
    listing.transactionType === 'rent'
      ? t('pricePerMonth', { values: { price: formattedPrice } })
      : t('price', { values: { price: formattedPrice } });

  const summaryItems: Array<{
    icon: LucideIcon;
    label: string;
  }> = [];

  if (listing.bedrooms != null) {
    summaryItems.push({
      icon: BedDouble,
      label: t('summary.beds', { values: { count: listing.bedrooms } }),
    });
  }
  if (listing.bathrooms != null) {
    summaryItems.push({
      icon: Bath,
      label: t('summary.baths', { values: { count: listing.bathrooms } }),
    });
  }
  if (listing.area != null) {
    summaryItems.push({
      icon: Ruler,
      label: t('summary.area', { values: { value: listing.area } }),
    });
  }
  if (listing.parkingSpaces != null) {
    summaryItems.push({
      icon: Car,
      label: t('summary.parking', { values: { count: listing.parkingSpaces } }),
    });
  }
  if (listing.energyClass) {
    summaryItems.push({
      icon: Leaf,
      label: t('summary.energyClass', { values: { value: listing.energyClass } }),
    });
  }
  if (listing.yearBuilt != null) {
    summaryItems.push({
      icon: CalendarDays,
      label: t('summary.yearBuilt', { values: { year: listing.yearBuilt } }),
    });
  }

  const countryLabelMap: Record<string, string> = {
    LU: 'Luxembourg',
  };

  const countryLabel =
    countryLabelMap[listing.location.country] ?? listing.location.country;

  const addressLine = [
    listing.location.street,
    `${listing.location.postalCode} ${listing.location.city}`.trim(),
    countryLabel,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {listing.propertyType}
          </span>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            {listing.title}
          </h1>
          <p className="text-sm text-slate-500">
            {addressLine}
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium uppercase tracking-wide text-slate-500">
              {listing.transactionType === 'rent'
                ? t('pricePerMonthLabel')
                : t('priceLabel')}
            </span>
            <span className="text-2xl font-semibold text-slate-900">
              {priceLabel}
            </span>
          </div>
          {summaryItems.length > 0 && (
            <dl className="grid w-full gap-4 sm:grid-cols-3 md:w-auto md:grid-cols-6">
              {summaryItems.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <Icon className="h-5 w-5 text-slate-500" aria-hidden="true" />
                  <dd className="text-sm font-medium text-slate-900">{label}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </header>

      <ListingGallery
        title={listing.title}
        images={listing.images.map((image, index) => ({
          id: image.id,
          url: image.url,
          alt: image.alt,
          isPrimary: image.isPrimary || index === 0,
          displayOrder: image.displayOrder,
        }))}
        openLabel={t('gallery.open')}
        previousLabel={t('gallery.previous')}
        nextLabel={t('gallery.next')}
        closeLabel={t('gallery.close')}
      />

      <div className="grid gap-12 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-slate-900">
              {t('descriptionHeading')}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {listing.description ?? t('descriptionFallback')}
            </p>
          </section>

          <section className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {t('featuresHeading')}
            </h2>
            {listing.features.length === 0 ? (
              <p className="text-sm text-slate-500">
                {t('featuresEmpty')}
              </p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {listing.features.map((feature) => {
                  const Icon = feature.icon
                    ? (Icons[feature.icon as keyof typeof Icons] as Icons.LucideIcon | undefined)
                    : undefined;
                  return (
                    <li
                      key={feature.id}
                      className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"
                    >
                      {Icon && (
                        <Icon
                          className="mt-0.5 h-5 w-5 text-slate-500"
                          aria-hidden="true"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {feature.label}
                        </span>
                        {feature.value && (
                          <span className="text-sm text-slate-500">
                            {feature.value}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-8">
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {t('mapHeading')}
            </h2>
            {listing.location.coordinates.lat != null &&
            listing.location.coordinates.lng != null ? (
              <ListingMap
                title={listing.title}
                priceLabel={priceLabel}
                coordinates={listing.location.coordinates}
              />
            ) : (
              <p className="text-sm text-slate-500">
                {t('mapUnavailable')}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              {t('contactHeading')}
            </h2>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {listing.owner.name ?? t('contactFallbackName')}
                </p>
                <p className="text-xs text-slate-500">{listing.owner.email}</p>
              </div>
              <dl className="grid gap-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('contactEmail')}
                  </dt>
                  <dd className="text-sm text-slate-700">{listing.owner.email}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t('contactPhone')}
                  </dt>
                  <dd className="text-sm text-slate-700">
                    {listing.owner.phoneNumber ?? t('contactUnavailable')}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800"
              >
                {t('contactCta')}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </article>
  );
}
