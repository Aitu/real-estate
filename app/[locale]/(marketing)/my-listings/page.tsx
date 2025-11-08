import { isLocale, type Locale } from '@/lib/i18n/config';
import { loadMessages } from '@/lib/i18n/get-messages';
import { getTranslator } from '@/lib/i18n/server';
import { getUser } from '@/lib/db/queries';
import { redirect, notFound } from 'next/navigation';
import { fetchOwnerListings } from './actions';
import { MyListingsManager, type MyListingsCopy } from './my-listings-manager';
import type { ListingStatus } from '@/lib/types/listing';
import type { OwnerListingSort } from '@/lib/db/listings';

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT: OwnerListingSort = 'created-desc';
const PROPERTY_TYPES = ['apartment', 'house', 'duplex', 'penthouse', 'office', 'land'] as const;
const STATUSES: ListingStatus[] = ['draft', 'published', 'inactive'];

function parsePage(value: string | string[] | undefined) {
  if (!value) return 1;
  const parsed = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
}

function parseSort(value: string | string[] | undefined): OwnerListingSort {
  if (!value) return DEFAULT_SORT;
  const sortValue = Array.isArray(value) ? value[0] : value;
  const allowed: OwnerListingSort[] = ['created-desc', 'created-asc', 'price-desc', 'price-asc'];
  return allowed.includes(sortValue as OwnerListingSort)
    ? (sortValue as OwnerListingSort)
    : DEFAULT_SORT;
}

export default async function MyListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    const callbackUrl = encodeURIComponent(`/${locale}/my-listings`);
    redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
  }

  const resolvedParams = await searchParams;
  const page = parsePage(resolvedParams?.page);
  const sort = parseSort(resolvedParams?.sort);

  const [messages, listingResult] = await Promise.all([
    loadMessages(locale as Locale),
    fetchOwnerListings(user.id, { page, pageSize: DEFAULT_PAGE_SIZE, sort }),
  ]);

  const t = getTranslator(locale as Locale, messages, 'myListings');

  const propertyTypeOptions = PROPERTY_TYPES.map((type) => ({
    value: type,
    label: t(`form.propertyTypes.${type}`),
  }));

  const statusOptions = STATUSES.map((status) => ({
    value: status,
    label: t(`statuses.${status}`),
  }));

  const propertyTypeLabels = Object.fromEntries(
    propertyTypeOptions.map((option) => [option.value, option.label])
  );

  const statusLabels = Object.fromEntries(
    statusOptions.map((option) => [option.value, option.label])
  ) as Record<ListingStatus, string>;

  const copy: MyListingsCopy = {
    heading: {
      title: t('heading.title'),
      subtitle: t('heading.subtitle'),
    },
    createButton: t('createButton'),
    table: {
      headers: {
        listing: t('table.headers.listing'),
        status: t('table.headers.status'),
        price: t('table.headers.price'),
        updated: t('table.headers.updated'),
        actions: t('table.headers.actions'),
      },
      view: t('table.actions.view'),
      edit: t('table.actions.edit'),
      deactivate: t('table.actions.deactivate'),
      deactivatePending: t('table.actions.deactivatePending'),
      confirmDeactivate: t('table.actions.confirmDeactivate'),
      noResults: t('table.noResults'),
    },
    statusLabels,
    propertyTypeLabels,
    pagination: {
      previous: t('pagination.previous'),
      next: t('pagination.next'),
      summary: t('pagination.summary'),
    },
    sort: {
      label: t('sort.label'),
      options: [
        { value: 'created-desc', label: t('sort.options.createdDesc') },
        { value: 'created-asc', label: t('sort.options.createdAsc') },
        { value: 'price-desc', label: t('sort.options.priceDesc') },
        { value: 'price-asc', label: t('sort.options.priceAsc') },
      ],
    },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <MyListingsManager
        locale={locale}
        listings={listingResult.listings}
        pagination={{
          page,
          pageSize: DEFAULT_PAGE_SIZE,
        totalCount: listingResult.totalCount,
      }}
      sort={sort}
      copy={copy}
    />
  </div>
);
}
