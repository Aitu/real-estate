import { notFound } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getUser } from '@/lib/db/queries';
import { getFavoriteListingSummaries } from '@/lib/db/favorites';
import { FavoritesDashboard } from '@/components/favorites/favorites-dashboard';

export default async function FavoritesPage({
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
    return (
      <FavoritesDashboard
        initialFavorites={[]}
        isAuthenticated={false}
        signInPath={`/${locale}/login`}
      />
    );
  }

  const favorites = await getFavoriteListingSummaries(user.id);

  return (
    <FavoritesDashboard
      initialFavorites={favorites}
      isAuthenticated
      signInPath=""
    />
  );
}
