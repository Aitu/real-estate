import { addFavorite, getFavoriteListingSummaries, removeFavorite } from '@/lib/db/favorites';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const favorites = await getFavoriteListingSummaries(user.id);
  return Response.json(favorites);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return new Response('Invalid payload', { status: 400 });
  }

  const listingId = typeof body === 'object' && body !== null
    ? Number((body as { listingId?: unknown }).listingId)
    : NaN;

  if (!Number.isFinite(listingId) || listingId <= 0) {
    return new Response('Invalid listing id', { status: 400 });
  }

  const favorite = await addFavorite(user.id, listingId);
  if (!favorite) {
    return new Response('Listing not found', { status: 404 });
  }

  return Response.json(favorite, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return new Response('Invalid payload', { status: 400 });
  }

  const listingId = typeof body === 'object' && body !== null
    ? Number((body as { listingId?: unknown }).listingId)
    : NaN;

  if (!Number.isFinite(listingId) || listingId <= 0) {
    return new Response('Invalid listing id', { status: 400 });
  }

  await removeFavorite(user.id, listingId);
  return Response.json({ success: true });
}
