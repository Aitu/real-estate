import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/lib/i18n/config';
import { getUser } from '@/lib/db/queries';
import { getFavoriteListingSummaries } from '@/lib/db/favorites';
import { FavoritesDashboard } from '@/components/favorites/favorites-dashboard';

export default async function FavoritesPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const user = await getUser();

  if (!user) {
    const callbackUrl = encodeURIComponent(`/${locale}/favorites`);
    redirect(`/${locale}/login?callbackUrl=${callbackUrl}`);
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
