'use client';

import { useActionState } from 'react';
import type { ChangeEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { OwnerListing, ListingStatus } from '@/lib/types/listing';
import { deactivateListing, deleteListing, reactivateListing } from './actions';
import type { ActionState } from '@/lib/auth/middleware';
import type { OwnerListingSort } from '@/lib/db/listings';
import { useFormStatus } from 'react-dom';
import { Eye, Heart, Loader2, PencilLine, PhoneCall, Power, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const STATUS_BADGE_STYLES: Record<ListingStatus, string> = {
  draft: 'bg-amber-100 text-amber-700 border-amber-200',
  published: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ACTION_ICON_BASE_CLASS =
  'inline-flex h-8 w-8 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const ACTION_ICON_NEUTRAL_CLASS = `${ACTION_ICON_BASE_CLASS} text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-slate-300`;
const ACTION_ICON_DESTRUCTIVE_CLASS = `${ACTION_ICON_BASE_CLASS} text-rose-500 hover:text-rose-600 hover:bg-rose-50 focus-visible:outline-rose-200`;
const ACTION_ICON_POSITIVE_CLASS = `${ACTION_ICON_BASE_CLASS} text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 focus-visible:outline-emerald-200`;

export type MyListingsCopy = {
  heading: { title: string; subtitle: string };
  createButton: string;
  table: {
    headers: {
      listing: string;
      status: string;
      price: string;
      stats: string;
      updated: string;
      actions: string;
    };
    view: string;
    edit: string;
    deactivate: string;
    deactivatePending: string;
    confirmDeactivate: string;
    delete: string;
    deletePending: string;
    confirmDelete: string;
    reactivate: string;
    reactivatePending: string;
    confirmReactivate: string;
    noResults: string;
  };
  statusLabels: Record<ListingStatus, string>;
  propertyTypeLabels: Record<string, string>;
  stats: {
    views: string;
    favorites: string;
    contacts: string;
    notAvailable: string;
  };
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
  return (
    <ListingActionForm
      action={deactivateListing}
      listingId={listingId}
      locale={locale}
      label={label}
      pendingLabel={pendingLabel}
      confirmMessage={confirmMessage}
      icon={icon}
      tone="danger"
    />
  );
}

function DeleteListingForm({
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
  return (
    <ListingActionForm
      action={deleteListing}
      listingId={listingId}
      locale={locale}
      label={label}
      pendingLabel={pendingLabel}
      confirmMessage={confirmMessage}
      icon={icon}
      tone="danger"
    />
  );
}

function ReactivateListingForm({
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
  return (
    <ListingActionForm
      action={reactivateListing}
      listingId={listingId}
      locale={locale}
      label={label}
      pendingLabel={pendingLabel}
      confirmMessage={confirmMessage}
      icon={icon}
      tone="positive"
    />
  );
}

type ActionTone = 'neutral' | 'danger' | 'positive';
type ListingActionHandler = (
  previousState: ActionState,
  formData: FormData
) => Promise<ActionState>;

function ListingActionForm({
  action,
  listingId,
  locale,
  label,
  pendingLabel,
  confirmMessage,
  icon,
  tone = 'neutral',
}: {
  action: ListingActionHandler;
  listingId: number;
  locale: string;
  label: string;
  pendingLabel: string;
  confirmMessage?: string;
  icon: LucideIcon;
  tone?: ActionTone;
}) {
  const [, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="listingId" value={listingId} />
      <ActionIconButton
        label={label}
        pendingLabel={pendingLabel}
        icon={icon}
        tone={tone}
      />
    </form>
  );
}

function ActionIconButton({
  label,
  pendingLabel,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  pendingLabel: string;
  icon: LucideIcon;
  tone?: ActionTone;
}) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === 'danger'
      ? ACTION_ICON_DESTRUCTIVE_CLASS
      : tone === 'positive'
        ? ACTION_ICON_POSITIVE_CLASS
        : ACTION_ICON_NEUTRAL_CLASS;

  return (
    <button
      type="submit"
      aria-label={label}
      title={pending ? pendingLabel : label}
      className={`${toneClass} ${pending ? 'cursor-not-allowed opacity-60' : ''}`}
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
      className={ACTION_ICON_NEUTRAL_CLASS}
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
                {copy.table.headers.stats}
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
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  {copy.table.noResults}
                </td>
              </tr>
            ) : (
              listings.map((listing) => {
                const badgeClass = STATUS_BADGE_STYLES[listing.status] ?? STATUS_BADGE_STYLES.inactive;
                const statusLabel = copy.statusLabels[listing.status] ?? listing.status;
                const propertyTypeLabel =
                  copy.propertyTypeLabels[listing.propertyType] ?? listing.propertyType;
                const isPublished = listing.status === 'published';
                const isInactive = listing.status === 'inactive';
                const canDelete = listing.status === 'draft' || isInactive;
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
                    <td className="px-4 py-4 align-top">
                      {listing.status === 'published' ? (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            {listing.viewsCount ?? 0} {copy.stats.views}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            <Heart className="h-3.5 w-3.5 text-slate-500" />
                            {listing.favoritesCount ?? 0} {copy.stats.favorites}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
                            {listing.contactsCount ?? 0} {copy.stats.contacts}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">{copy.stats.notAvailable}</span>
                      )}
                    </td>
                    <td className="px-4 py-4 align-top text-xs text-slate-500">
                      {formatDate(locale, listing.updatedAt)}
                    </td>
                    <td className="px-4 py-4 align-top text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <ActionIconLink
                          href={`/${locale}/listings/${listing.id}`}
                          label={copy.table.view}
                          icon={Eye}
                        />
                        <ActionIconLink
                          href={`/${locale}/my-listings/${listing.id}`}
                          label={copy.table.edit}
                          icon={PencilLine}
                        />
                        {isInactive ? (
                          <ReactivateListingForm
                            listingId={listing.id}
                            locale={locale}
                            label={copy.table.reactivate}
                            pendingLabel={copy.table.reactivatePending}
                            confirmMessage={copy.table.confirmReactivate}
                            icon={Power}
                          />
                        ) : null}
                        {isPublished ? (
                          <DeactivateListingForm
                            listingId={listing.id}
                            locale={locale}
                            label={copy.table.deactivate}
                            pendingLabel={copy.table.deactivatePending}
                            confirmMessage={copy.table.confirmDeactivate}
                            icon={Power}
                          />
                        ) : null}
                        {canDelete ? (
                          <DeleteListingForm
                            listingId={listing.id}
                            locale={locale}
                            label={copy.table.delete}
                            pendingLabel={copy.table.deletePending}
                            confirmMessage={copy.table.confirmDelete}
                            icon={Trash2}
                          />
                        ) : null}
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
