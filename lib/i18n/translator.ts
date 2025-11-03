import type { Locale } from './config';
import type { Messages } from './get-messages';

export type TranslationValues = Record<string, string | number>;

export interface TranslationOptions {
  fallback?: string;
  values?: TranslationValues;
}

function getNestedMessage(messages: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === 'object' && segment in acc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (acc as any)[segment];
    }
    return undefined;
  }, messages);
}

function formatMessage(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return Object.entries(values).reduce((result, [token, value]) => {
    const pattern = new RegExp(`{${token}}`, 'g');
    return result.replace(pattern, String(value));
  }, template);
}

export function translateMessage(
  messages: Messages,
  key: string,
  { fallback, values }: TranslationOptions = {}
) {
  const result = getNestedMessage(messages, key);

  if (typeof result === 'string') {
    return formatMessage(result, values);
  }

  if (Array.isArray(result)) {
    return result.join(' ');
  }

  return fallback ?? key;
}

export function createTranslator(
  _locale: Locale,
  messages: Messages,
  namespace?: string
) {
  const prefix = namespace ? `${namespace}.` : '';

  return (key: string, options?: TranslationOptions) =>
    translateMessage(messages, `${prefix}${key}`, options);
}
