import NextAuth from 'next-auth';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export function auth() {
  return getServerSession(authOptions);
}
