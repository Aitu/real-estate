import { and, eq, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { listings } from '@/lib/db/schema';

type ExpireListingsOptions = {
  batchSize?: number;
  now?: Date;
};

/**
 * Background-friendly expirations: walks published listings with missing/expired
 * `expiresAt` and marks them inactive in batches to avoid long locks.
 */
export async function expireListingsInBatches(
  { batchSize = 500, now = new Date() }: ExpireListingsOptions = {}
): Promise<{ expiredIds: number[]; total: number }> {
  const expiredIds: number[] = [];
  const ts = now;

  // Loop in batches to keep the query light for large datasets.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidates = await db
      .select({ id: listings.id })
      .from(listings)
      .where(
        and(
          eq(listings.status, 'published'),
          or(isNull(listings.expiresAt), lte(listings.expiresAt, ts))
        )
      )
      .limit(batchSize);

    if (candidates.length === 0) {
      break;
    }

    const ids = candidates.map((row) => row.id);
    expiredIds.push(...ids);

    await db
      .update(listings)
      .set({
        status: 'inactive',
        paymentStatus: 'unpaid',
        publishedAt: null,
        updatedAt: ts,
      })
      .where(inArray(listings.id, ids));
  }

  return { expiredIds, total: expiredIds.length };
}
