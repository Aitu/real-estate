import { defaultLocale, isLocale, type Locale } from './config';

interface ParsedLanguage {
  code: string;
  quality: number;
}

function parseAcceptLanguage(header: string | null): ParsedLanguage[] {
  if (!header) {
    return [];
  }

  return header
    .split(',')
    .map((chunk) => {
      const [lang, qValue] = chunk.trim().split(';q=');
      const quality = qValue ? parseFloat(qValue) : 1;
      return { code: lang.toLowerCase(), quality };
    })
    .sort((a, b) => b.quality - a.quality);
}

export function matchLocale(header: string | null): Locale {
  const parsed = parseAcceptLanguage(header);

  for (const { code } of parsed) {
    const base = code.split('-')[0];
    if (isLocale(code)) {
      return code;
    }
    if (isLocale(base)) {
      return base;
    }
  }

  return defaultLocale;
}

export function stripLocale(pathname: string): { locale: Locale | null; pathname: string } {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];

  if (potentialLocale && isLocale(potentialLocale)) {
    const normalized = `/${segments.slice(1).join('/')}`;
    return {
      locale: potentialLocale,
      pathname: normalized.startsWith('/') ? normalized : `/${normalized}`
    };
  }

  return { locale: null, pathname };
}

export function getLocalizedPath(locale: Locale, pathname: string) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (normalized === '/') {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}
