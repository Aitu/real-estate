'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo
} from 'react';
import type { Locale } from './config';
import type { Messages } from './get-messages';
import {
  createTranslator,
  TranslationOptions
} from './translator';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  t: (key: string, options?: TranslationOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children
}: {
  locale: Locale;
  messages: Messages;
  children: ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute('lang', locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      messages,
      t: createTranslator(locale, messages)
    };
  }, [locale, messages]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}

export function useTranslations(namespace?: string) {
  const { t } = useI18n();
  return (key: string, options?: TranslationOptions) =>
    t(namespace ? `${namespace}.${key}` : key, options);
}
