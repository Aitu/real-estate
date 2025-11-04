import { NextResponse } from 'next/server';
import { getListingDetail } from '@/lib/db/listings';

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const { id: idParam } = context.params;
  const listingId = Number(idParam);

  if (!idParam || Number.isNaN(listingId)) {
    return NextResponse.json(
      { error: 'Invalid listing id' },
      { status: 400 }
    );
  }

  const listing = await getListingDetail(listingId);

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
  }

  return NextResponse.json(listing);
}
