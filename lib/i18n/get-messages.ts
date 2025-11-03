import type { Locale } from './config';

export type Messages = Record<string, any>;

export async function loadMessages(locale: Locale): Promise<Messages> {
  switch (locale) {
    case 'fr':
      return (await import('@/messages/fr.json')).default;
    case 'de':
      return (await import('@/messages/de.json')).default;
    case 'en':
    default:
      return (await import('@/messages/en.json')).default;
  }
}
