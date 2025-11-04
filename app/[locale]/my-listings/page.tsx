import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PlusCircle, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getUser } from '@/lib/db/queries';
import { getListingsForOwner } from '@/lib/db/listings';
import { isLocale } from '@/lib/i18n/config';

const PUBLISHED_STATUS_CLASS =
  'inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600';
const DRAFT_STATUS_CLASS =
  'inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600';

function formatUpdatedAt(value: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

export default async function MyListingsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;

  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getUser();
  if (!user) {
    redirect(`/sign-in?redirect=/${locale}/my-listings`);
  }

  const listings = await getListingsForOwner(user.id);

  return (
    <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">My listings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Track drafts, update details, and publish your properties when they are ready.
            </p>
          </div>
          <Button asChild size="sm" className="inline-flex items-center gap-2">
            <Link href={`/${locale}/my-listings/new`}>
              <PlusCircle className="h-4 w-4" />
              New listing
            </Link>
          </Button>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {listings.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {listings.map((listing) => {
                const isPublished = listing.status === 'published';
                const statusLabel = isPublished ? 'Published' : 'Draft';
                const statusClass = isPublished
                  ? PUBLISHED_STATUS_CLASS
                  : DRAFT_STATUS_CLASS;
                const transactionLabel =
                  listing.transactionType === 'rent' ? 'For rent' : 'For sale';

                return (
                  <li
                    key={listing.id}
                    className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{listing.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {listing.city} · {transactionLabel} · Updated{' '}
                        {formatUpdatedAt(listing.updatedAt, locale)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={statusClass}>{statusLabel}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/${locale}/my-listings/${listing.id}`}>Edit</Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="inline-flex items-center gap-1"
                      >
                        <Link
                          href={`/${locale}/listings/${listing.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-start gap-4 py-10 text-left">
              <p className="text-sm text-slate-600">
                You have not created any listings yet. Start by drafting your first property.
              </p>
              <Button asChild size="sm" className="inline-flex items-center gap-2">
                <Link href={`/${locale}/my-listings/new`}>
                  <PlusCircle className="h-4 w-4" />
                  Create listing
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
