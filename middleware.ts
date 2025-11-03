import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';
import { matchLocale, stripLocale, getLocalizedPath } from '@/lib/i18n/locale-matcher';
import { defaultLocale } from '@/lib/i18n/config';

const EXCLUDED_PREFIXES = ['/api', '/_next', '/static', '/favicon.ico'];
const EXCLUDED_EXACT = ['/sign-in', '/sign-up', '/login'];
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

  let response = NextResponse.next();
  const sessionCookie = request.cookies.get('session');
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    normalizedPath.startsWith(route)
  );

  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (sessionCookie && request.method === 'GET') {
    try {
      const parsed = await verifyToken(sessionCookie.value);
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);

      response.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString()
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay
      });
    } catch (error) {
      console.error('Error updating session:', error);
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs'
};
