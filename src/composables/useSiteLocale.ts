import type { Ref } from "vue";
import { useI18n } from "vue-i18n";
import languages from "@/locales/languages";
import { useRootStateStore } from "@/store/rootState/store";

/** Locale codes the site offers in the app-bar language picker. */
export const getActiveLanguages = (): string[] => Object.keys(languages);

/** Reads and changes the site-wide language (the app-bar picker and anything else that needs it). */
export function useSiteLocale(): { locale: Ref<string>; setSiteLocale: (newLocale: string) => void } {
  const { locale } = useI18n();
  const rootStateStore = useRootStateStore();

  const setSiteLocale = (newLocale: string): void => {
    locale.value = newLocale;
    rootStateStore.saveLocale(newLocale);
  };

  return { locale, setSiteLocale };
}
