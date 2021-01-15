const localeLocalStorageKey = "w3c-locale";

export default class LocaleService {
  public setLocale(locale: string) {
    localStorage.setItem(localeLocalStorageKey, locale);
  }

  public getLocale(): string {
    const locale = localStorage.getItem(localeLocalStorageKey);
    return locale?.toString() ?? 'en';
  }
}
