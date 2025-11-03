import type { Locale } from './config';
import type { Messages } from './get-messages';
import { createTranslator, TranslationOptions } from './translator';

export function getTranslator(
  locale: Locale,
  messages: Messages,
  namespace?: string
) {
  const translator = createTranslator(locale, messages, namespace);
  return (key: string, options?: TranslationOptions) => translator(key, options);
}
