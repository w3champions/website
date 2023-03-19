const localeLocalStorageKey = "w3c-locale";

export default class LocaleService {
  public static setLocale(locale: string) {
    localStorage.setItem(localeLocalStorageKey, locale);
  }

  public static getLocale(): string {
    const locale = localStorage.getItem(localeLocalStorageKey);
    return locale?.toString() ?? "en";
  }
}
