import { mockListings } from '@/lib/mock/listings';
import type { ListingSummary } from '@/lib/types/listing';

export async function getFeaturedListings(): Promise<ListingSummary[]> {
  // TODO: Replace mock data with Supabase-backed query when available.
  return mockListings;
}
