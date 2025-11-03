import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { I18nProvider } from '@/lib/i18n/provider';
import { loadMessages } from '@/lib/i18n/get-messages';
import { isLocale, locales, type Locale } from '@/lib/i18n/config';

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const { locale: requestedLocale } = params;

  if (!isLocale(requestedLocale)) {
    notFound();
  }

  const messages = await loadMessages(requestedLocale);

  return (
    <I18nProvider locale={requestedLocale as Locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}
