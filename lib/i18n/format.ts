import type { Locale } from './config';

const LOCALE_TO_TAG: Record<Locale, string> = {
  en: 'en-LU',
  fr: 'fr-LU',
  de: 'de-LU',
};

export function getLocaleDisplayTag(locale: Locale): string {
  return LOCALE_TO_TAG[locale] ?? 'en-LU';
}

interface FormatCurrencyOptions extends Intl.NumberFormatOptions {
  locale: Locale;
  currency: string;
}

export function formatCurrency(
  value: number,
  { locale, currency, ...formatOptions }: FormatCurrencyOptions
): string {
  const localeTag = getLocaleDisplayTag(locale);

  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    maximumFractionDigits: 0,
    ...formatOptions,
    currency,
  }).format(value);
}
