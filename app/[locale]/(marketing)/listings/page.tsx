import { notFound } from 'next/navigation';
import { getFeaturedListings } from '@/lib/data/listings';
import { ListingsSearchBar } from '@/components/listings/listings-search-bar';
import { ListingsFilters } from '@/components/listings/listings-filters';
import { ListingsTable } from '@/components/listings/listings-table';
import { isLocale, type Locale } from '@/lib/i18n/config';
import { loadMessages } from '@/lib/i18n/get-messages';
import { getTranslator } from '@/lib/i18n/server';
import type { ListingSummary } from '@/lib/types/listing';

const PROPERTY_TYPES = ['all', 'apartment', 'house', 'duplex', 'penthouse', 'office', 'land'] as const;
const TRANSACTION_TYPES = ['all', 'sale', 'rent'] as const;
const PAGE_SIZE = 10;

type ListingsSearchParams = Record<string, string | string[] | undefined>;

export default async function ListingsDirectoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<ListingsSearchParams>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  if (!isLocale(locale)) {
    notFound();
  }

  const [messages, allListings] = await Promise.all([
    loadMessages(locale as Locale),
    getFeaturedListings(),
  ]);

  const tDirectory = getTranslator(locale as Locale, messages, 'listingsDirectory');
  const tMyListings = getTranslator(locale as Locale, messages, 'myListings');

  const normalizedParams = normalizeParams(resolvedSearchParams);
  const filters = parseFilters(normalizedParams);
  const filteredListings = applyFilters(allListings, filters);
  const sortedListings = filteredListings.slice().sort((a, b) => b.price - a.price);

  const totalPages = Math.max(1, Math.ceil(sortedListings.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(parsePage(normalizedParams.page), 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedListings = sortedListings.slice(startIndex, startIndex + PAGE_SIZE);

  const propertyTypeOptions = PROPERTY_TYPES.map((type) => ({
    value: type,
    label:
      type === 'all'
        ? tDirectory('filters.propertyTypeAll')
        : tMyListings(`form.propertyTypes.${type}`),
  }));

  const transactionOptions = TRANSACTION_TYPES.map((type) => ({
    value: type,
    label:
      type === 'all'
        ? tDirectory('filters.transactionAll')
        : type === 'sale'
        ? tMyListings('form.transaction.sale')
        : tMyListings('form.transaction.rent'),
  }));

  const paginationSummary = tDirectory('pagination.pageCounter', {
    values: { page: currentPage, pages: totalPages },
  });

  const previousHref =
    currentPage > 1
      ? buildHref(locale, normalizedParams, currentPage - 1)
      : null;
  const nextHref =
    currentPage < totalPages
      ? buildHref(locale, normalizedParams, currentPage + 1)
      : null;

  const filtersCopy = {
    title: tDirectory('filters.title'),
    transaction: tDirectory('filters.transaction'),
    propertyType: tDirectory('filters.propertyType'),
    priceMin: tDirectory('filters.priceMin'),
    priceMax: tDirectory('filters.priceMax'),
    bedrooms: tDirectory('filters.bedrooms'),
    bathrooms: tDirectory('filters.bathrooms'),
    apply: tDirectory('filters.apply'),
    reset: tDirectory('filters.reset'),
    mobileToggle: tDirectory('filters.mobileToggle'),
  };

  const tableCopy = {
    headers: {
      property: tDirectory('table.headers.property'),
      location: tDirectory('table.headers.location'),
      price: tDirectory('table.headers.price'),
      beds: tDirectory('table.headers.beds'),
      baths: tDirectory('table.headers.baths'),
      area: tDirectory('table.headers.area'),
    },
    empty: tDirectory('table.empty'),
  };

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            LuxNest
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {tDirectory('title')}
          </h1>
          <p className="text-base text-slate-600">{tDirectory('subtitle')}</p>
        </header>

        <div className="mt-6">
          <ListingsSearchBar
            placeholder={tDirectory('search.placeholder')}
            buttonLabel={tDirectory('search.button')}
          />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          <ListingsFilters
            copy={filtersCopy}
            propertyTypes={propertyTypeOptions}
            transactionTypes={transactionOptions}
          />
          <ListingsTable
            locale={locale}
            listings={paginatedListings}
            copy={tableCopy}
            pagination={{
              summary: paginationSummary,
              previousLabel: tDirectory('pagination.previous'),
              nextLabel: tDirectory('pagination.next'),
              previousHref,
              nextHref,
            }}
          />
        </div>
      </div>
    </main>
  );
}

function normalizeParams(searchParams: ListingsSearchParams): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      normalized[key] = candidate;
    }
  });
  return normalized;
}

function parsePage(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function parseFilters(query: Record<string, string>) {
  return {
    query: query.q ?? '',
    transaction: query.transaction ?? 'all',
    type: query.type ?? 'all',
    minPrice: parseNullableNumber(query.minPrice),
    maxPrice: parseNullableNumber(query.maxPrice),
    beds: parseNullableNumber(query.beds),
    baths: parseNullableNumber(query.baths),
  };
}

function parseNullableNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function applyFilters(listings: ListingSummary[], filters: ReturnType<typeof parseFilters>) {
  const keyword = filters.query.toLowerCase();

  return listings.filter((listing) => {
    if (keyword) {
      const haystack = `${listing.title} ${listing.location.city} ${listing.location.country}`.toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }

    if (filters.transaction !== 'all' && listing.priceType !== filters.transaction) {
      return false;
    }

    if (filters.type !== 'all' && listing.category !== filters.type) {
      return false;
    }

    if (filters.minPrice != null && listing.price < filters.minPrice) {
      return false;
    }

    if (filters.maxPrice != null && listing.price > filters.maxPrice) {
      return false;
    }

    if (filters.beds != null && listing.bedrooms < filters.beds) {
      return false;
    }

    if (filters.baths != null && listing.bathrooms < filters.baths) {
      return false;
    }

    return true;
  });
}

function buildHref(
  locale: string,
  currentParams: Record<string, string>,
  page: number
) {
  const params = new URLSearchParams();

  Object.entries(currentParams).forEach(([key, value]) => {
    if (key !== 'page') {
      params.set(key, value);
    }
  });

  if (page > 1) {
    params.set('page', String(page));
  }

  const query = params.toString();
  return query ? `/${locale}/listings?${query}` : `/${locale}/listings`;
}
