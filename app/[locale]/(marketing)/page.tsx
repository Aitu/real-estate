import { Suspense } from 'react';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { loadMessages } from '@/lib/i18n/get-messages';
import { getTranslator } from '@/lib/i18n/server';
import { getFeaturedListings } from '@/lib/data/listings';
import { ListingSearchForm } from '@/components/search/listing-search-form';
import { ListingGrid } from '@/components/listings/listing-grid';
import { ListingsMap } from '@/components/map/listings-map';
import { notFound } from 'next/navigation';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const [messages, listings] = await Promise.all([
    loadMessages(locale as Locale),
    getFeaturedListings()
  ]);

  const tHero = getTranslator(locale as Locale, messages, 'hero');
  const tListings = getTranslator(locale as Locale, messages, 'listings');
  const tMap = getTranslator(locale as Locale, messages, 'map');

  return (
    <div className="flex flex-col gap-24 pb-16">
      <HeroSection
        anchor="buy"
        title={tHero('title')}
        subtitle={tHero('subtitle')}
        cta={tHero('cta')}
      />

      <section
        id="rent"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8"
      >
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
            {tListings('sectionTitle')}
          </h2>
          <p className="max-w-2xl text-sm text-slate-500 md:text-base">
            {tListings('sectionSubtitle')}
          </p>
        </header>
        <ListingGrid listings={listings} />
      </section>

      <section
        id="sell"
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">{tMap('title')}</h2>
          <ListingsMap listings={listings} />
        </div>
      </section>
    </div>
  );
}

function HeroSection({
  anchor,
  title,
  subtitle,
  cta
}: {
  anchor: string;
  title: string;
  subtitle: string;
  cta: string;
}) {
  return (
    <section
      id={anchor}
      className="relative isolate overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800"
    >
      <div className="absolute inset-0 opacity-40" aria-hidden="true">
        <div className="absolute -left-10 top-16 h-72 w-72 rounded-full bg-amber-400 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-slate-500 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="max-w-2xl text-white">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-200 md:text-base">
            {subtitle}
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/10 px-5 py-2 text-sm text-slate-100 backdrop-blur">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {cta}
          </div>
        </div>
        <Suspense fallback={null}>
          <ListingSearchForm />
        </Suspense>
      </div>
    </section>
  );
}
