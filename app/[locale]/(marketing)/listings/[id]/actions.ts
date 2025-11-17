'use server';

import { getListingDetail } from '@/lib/db/listings';
import { incrementListingContact } from '@/lib/db/listings';
import { getUser } from '@/lib/db/queries';

export async function fetchListingDetail(listingId: number) {
  return getListingDetail(listingId);
}

export async function incrementListingContactAction(formData: FormData) {
  const listingIdValue = formData.get('listingId');
  const listingId = Number(listingIdValue);
  if (!Number.isFinite(listingId)) {
    throw new Error('Invalid listing id');
  }
  const user = await getUser();
  await incrementListingContact(listingId, user?.id);
}
