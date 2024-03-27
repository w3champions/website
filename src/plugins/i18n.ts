import { createI18n, FallbackLocale, Locale } from 'vue-i18n';
import languages from '@/locales/languages';

export const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: languages,
});

export const { t, tc, locale } = i18n.global;
