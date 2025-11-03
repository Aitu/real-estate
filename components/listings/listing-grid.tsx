'use client';

import { useCallback, useState } from 'react';
import type { ListingSummary } from '@/lib/types/listing';
import { ListingCard } from './listing-card';

interface ListingGridProps {
  listings: ListingSummary[];
}

export function ListingGrid({ listings }: ListingGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const handleToggle = useCallback((listingId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(listingId)) {
        next.delete(listingId);
      } else {
        next.add(listingId);
      }
      return next;
    });
  }, []);

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          isFavorite={favorites.has(listing.id)}
          onToggleFavorite={handleToggle}
        />
      ))}
    </div>
  );
}
