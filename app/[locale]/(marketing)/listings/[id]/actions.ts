'use server';

import { getListingDetail } from '@/lib/db/listings';

export async function fetchListingDetail(listingId: number) {
  return getListingDetail(listingId);
}
