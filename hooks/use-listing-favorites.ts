'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { ListingSummary } from '@/lib/types/listing';

type UseListingFavoritesOptions = {
  locale: string;
};

export function useListingFavorites({ locale }: UseListingFavoritesOptions) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const favoritesRef = useRef<Set<string>>(favorites);

  const callbackUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  useEffect(() => {
    if (!user) {
      const empty = new Set<string>();
      favoritesRef.current = empty;
      setFavorites(empty);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await fetch('/api/favorites', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to load favorites');
        }
        const payload = (await response.json()) as ListingSummary[];
        const ids = new Set(payload.map((item) => String(item.id)));
        if (!cancelled) {
          favoritesRef.current = ids;
          setFavorites(ids);
        }
      } catch {
        if (!cancelled) {
          const empty = new Set<string>();
          favoritesRef.current = empty;
          setFavorites(empty);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const redirectToAuth = useCallback(() => {
    const destination = `/${locale}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    router.push(destination);
  }, [locale, callbackUrl, router]);

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (!user) {
        redirectToAuth();
        return;
      }

      const numericId = Number.parseInt(listingId, 10);
      if (!Number.isFinite(numericId) || numericId <= 0) {
        return;
      }

      const previous = favoritesRef.current;
      const previousSnapshot = new Set(previous);
      const wasFavorite = previousSnapshot.has(listingId);

      const optimistic = new Set(previousSnapshot);
      if (wasFavorite) {
        optimistic.delete(listingId);
      } else {
        optimistic.add(listingId);
      }

      favoritesRef.current = optimistic;
      setFavorites(optimistic);

      try {
        const response = await fetch('/api/favorites', {
          method: wasFavorite ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ listingId: numericId }),
        });

        if (response.status === 401) {
          redirectToAuth();
          favoritesRef.current = previousSnapshot;
          setFavorites(previousSnapshot);
          return;
        }

        if (!response.ok) {
          throw new Error('Favorite request failed');
        }

        if (!wasFavorite) {
          // Ensure body is read to avoid leaking the connection.
          await response.json();
        }
      } catch {
        favoritesRef.current = previousSnapshot;
        setFavorites(previousSnapshot);
      }
    },
    [user, redirectToAuth]
  );

  return {
    favorites,
    toggleFavorite,
  };
}
