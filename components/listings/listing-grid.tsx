'use client';

import type { ListingSummary } from '@/lib/types/listing';
import { ListingCard } from './listing-card';
import { useI18n, useTranslations } from '@/lib/i18n/provider';
import { useListingFavorites } from '@/hooks/use-listing-favorites';

interface ListingGridProps {
  listings: ListingSummary[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  const { locale } = useI18n();
  const tDirectory = useTranslations('listingsDirectory');
  const { favorites, toggleFavorite } = useListingFavorites({ locale });

  const favoriteLabel = tDirectory('card.favorite');
  const favoriteSelectedLabel = tDirectory('card.favoriteSelected');

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favorites.has(listing.id)}
          onToggleFavorite={toggleFavorite}
          favoriteLabel={favoriteLabel}
          favoriteSelectedLabel={favoriteSelectedLabel}
        />
      ))}
    </div>
  );
}
