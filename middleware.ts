import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { matchLocale, stripLocale, getLocalizedPath } from '@/lib/i18n/locale-matcher';
import { defaultLocale } from '@/lib/i18n/config';

const EXCLUDED_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico'];
const EXCLUDED_EXACT = ['/login', '/signup', '/forgot-password', '/reset-password'];
const PROTECTED_ROUTES = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    EXCLUDED_EXACT.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const { locale, pathname: normalizedPath } = stripLocale(pathname);

  if (!locale) {
    const preferred = matchLocale(request.headers.get('accept-language'));
    const destination = getLocalizedPath(preferred ?? defaultLocale, pathname);
    return NextResponse.redirect(new URL(destination, request.url));
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );

  if (isProtectedRoute) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      const destination = getLocalizedPath(locale, '/login');
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
