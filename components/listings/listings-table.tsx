import Link from 'next/link';
import type { ListingSummary } from '@/lib/types/listing';

type ListingsTableProps = {
  locale: string;
  listings: ListingSummary[];
  copy: {
    headers: {
      property: string;
      location: string;
      price: string;
      beds: string;
      baths: string;
      area: string;
    };
    empty: string;
  };
  pagination: {
    summary: string;
    previousLabel: string;
    nextLabel: string;
    previousHref: string | null;
    nextHref: string | null;
  };
};

export function ListingsTable({
  locale,
  listings,
  copy,
  pagination,
}: ListingsTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">{copy.headers.property}</th>
              <th className="px-4 py-3 text-left">{copy.headers.location}</th>
              <th className="px-4 py-3 text-left">{copy.headers.price}</th>
              <th className="px-4 py-3 text-left">{copy.headers.beds}</th>
              <th className="px-4 py-3 text-left">{copy.headers.baths}</th>
              <th className="px-4 py-3 text-left">{copy.headers.area}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  {copy.empty}
                </td>
              </tr>
            ) : (
              listings.map((listing) => (
                <tr key={listing.id} className="text-slate-700">
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/${locale}/listings/${listing.id}`}
                        className="font-semibold text-slate-900 transition hover:text-orange-600"
                      >
                        {listing.title}
                      </Link>
                      <span className="text-xs uppercase tracking-wide text-slate-400">
                        {listing.category}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-slate-600">
                      {listing.location.city}, {listing.location.country}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {new Intl.NumberFormat(locale, {
                      style: 'currency',
                      currency: listing.currency ?? 'EUR',
                      maximumFractionDigits: 0,
                    }).format(listing.price)}
                  </td>
                  <td className="px-4 py-4">{formatStat(listing.bedrooms)}</td>
                  <td className="px-4 py-4">{formatStat(listing.bathrooms)}</td>
                  <td className="px-4 py-4">
                    {listing.areaSqm ? `${listing.areaSqm} m²` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

function formatStat(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return value;
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
