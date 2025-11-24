import { NextResponse } from 'next/server';
import { expireListingsInBatches } from '@/lib/jobs/expire-listings';

const CRON_TOKEN = process.env.CRON_SECRET;

export async function GET(request: Request) {
  if (CRON_TOKEN) {
    const header = request.headers.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token !== CRON_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { expiredIds, total } = await expireListingsInBatches();

  return NextResponse.json({
    expired: total,
    ids: expiredIds,
  });
}
