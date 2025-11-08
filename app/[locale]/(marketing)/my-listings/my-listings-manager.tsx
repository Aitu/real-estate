'use client';

import { useActionState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { OwnerListing, ListingStatus } from '@/lib/types/listing';
import { deactivateListing } from './actions';
import type { ActionState } from '@/lib/auth/middleware';
import type { OwnerListingSort } from '@/lib/db/listings';
import { useFormStatus } from 'react-dom';
import { Eye, Loader2, PencilLine, Power } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_BADGE_STYLES: Record<ListingStatus, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ACTION_ICON_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:text-slate-900 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300';

const ACTION_ICON_DESTRUCTIVE_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-full text-rose-500 transition hover:text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-200';

export type MyListingsCopy = {
  heading: { title: string; subtitle: string };
  createButton: string;
  table: {
    headers: {
      listing: string;
      status: string;
      price: string;
      updated: string;
      actions: string;
    };
    view: string;
    edit: string;
    deactivate: string;
    deactivatePending: string;
    confirmDeactivate: string;
    noResults: string;
  };
  statusLabels: Record<ListingStatus, string>;
  propertyTypeLabels: Record<string, string>;
  pagination: {
    previous: string;
    next: string;
    summary: string;
  };
  sort: {
    label: string;
    options: Array<{ value: OwnerListingSort; label: string }>;
  };
};

type MyListingsManagerProps = {
  locale: string;
  listings: OwnerListing[];
  pagination: { page: number; pageSize: number; totalCount: number };
  sort: OwnerListingSort;
  copy: MyListingsCopy;
};

function formatCurrency(locale: string, currency: string, value: number) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(locale: string, value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function replaceSummary(template: string, values: Record<string, number>) {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replace(`{${key}}`, value.toString());
  }, template);
}

function DeactivateListingForm({
  listingId,
  locale,
  label,
  pendingLabel,
  confirmMessage,
  icon,
}: {
  listingId: number;
  locale: string;
  label: string;
  pendingLabel: string;
  confirmMessage: string;
  icon: LucideIcon;
}) {
  const [, formAction] = useActionState<ActionState, FormData>(
    deactivateListing,
    {}
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listingId} />
      <DeactivateButton label={label} pendingLabel={pendingLabel} icon={icon} />
    </form>
  );
}

function DeactivateButton({
  label,
  pendingLabel,
  icon: Icon,
}: {
  label: string;
  pendingLabel: string;
  icon: LucideIcon;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      aria-label={label}
      title={pending ? pendingLabel : label}
      className={`${ACTION_ICON_DESTRUCTIVE_CLASS} ${pending ? 'cursor-not-allowed opacity-60' : ''}`}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Icon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

function ActionIconLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={ACTION_ICON_CLASS}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Link>
  );
}

export function MyListingsManager({
  locale,
  listings,
  pagination,
  sort,
  copy,
}: MyListingsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const totalPages = Math.max(1, Math.ceil(pagination.totalCount / pagination.pageSize));
  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.page < totalPages;
  const from = pagination.totalCount === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const to = pagination.totalCount === 0
    ? 0
    : Math.min(pagination.page * pagination.pageSize, pagination.totalCount);
  const summary = replaceSummary(copy.pagination.summary, {
    from,
    to,
    total: pagination.totalCount,
  });

  const basePath = pathname?.split('?')[0] ?? `/${locale}/my-listings`;

  const updateQuery = (nextPage: number, nextSort: OwnerListingSort) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('page', String(nextPage));
    params.set('sort', nextSort);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as OwnerListingSort;
    updateQuery(1, value);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
          {copy.heading.title}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 md:text-base">
          {copy.heading.subtitle}
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-600">{summary}</div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600" htmlFor="listing-sort">
              {copy.sort.label}
            </label>
            <select
              id="listing-sort"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              value={sort}
              onChange={handleSortChange}
            >
              {copy.sort.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button asChild variant="default">
              <Link href={`/${locale}/my-listings/new`}>{copy.createButton}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {copy.table.headers.listing}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {copy.table.headers.status}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {copy.table.headers.price}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {copy.table.headers.updated}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                {copy.table.headers.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  {copy.table.noResults}
                </td>
              </tr>
            ) : (
              listings.map((listing) => {
                const badgeClass = STATUS_BADGE_STYLES[listing.status] ?? STATUS_BADGE_STYLES.inactive;
                const statusLabel = copy.statusLabels[listing.status] ?? listing.status;
                const propertyTypeLabel =
                  copy.propertyTypeLabels[listing.propertyType] ?? listing.propertyType;
                return (
                  <tr key={listing.id}>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-slate-900">
                          {listing.title}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-500">
                          {propertyTypeLabel}
                        </span>
                        <span className="text-xs text-slate-500">
                          {[listing.city, listing.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${badgeClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-sm font-medium text-slate-900">
                      {formatCurrency(locale, listing.currency, listing.price)}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-500">
                      {formatDate(locale, listing.updatedAt)}
                    </td>
                    <td className="px-4 py-4 align-top text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <ActionIconLink
                          href={`/${locale}/${listing.id}`}
                          label={copy.table.view}
                          icon={Eye}
                        />
                        <ActionIconLink
                          href={`/${locale}/my-listings/${listing.id}`}
                          label={copy.table.edit}
                          icon={PencilLine}
                        />
                        <DeactivateListingForm
                          listingId={listing.id}
                          locale={locale}
                          label={copy.table.deactivate}
                          pendingLabel={copy.table.deactivatePending}
                          confirmMessage={copy.table.confirmDeactivate}
                          icon={Power}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      <nav className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={!hasPrevious}
          onClick={() => hasPrevious && updateQuery(pagination.page - 1, sort)}
        >
          {copy.pagination.previous}
        </Button>
        <div className="text-sm text-slate-600">
          {pagination.page} / {totalPages}
        </div>
        <Button
          variant="outline"
          disabled={!hasNext}
          onClick={() => hasNext && updateQuery(pagination.page + 1, sort)}
        >
          {copy.pagination.next}
        </Button>
      </nav>
    </div>
  );
}
