const localeLocalStorageKey = "w3c-locale";

export default class LocaleService {
    public static setLocale(locale: string) {
        localStorage.setItem(localeLocalStorageKey, locale)
    }

    public static getLocale(): string {
        const localeString = localStorage.getItem(localeLocalStorageKey);

        if (localeString) {
            return localeString;
        } else {
            // default language is English
            return 'en';
        }

    }
}