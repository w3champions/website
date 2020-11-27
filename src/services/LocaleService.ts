const localeLocalStorageKey = "w3c-locale";

export default class LocaleService {
    public static setLocale(locale: string) {

        console.log(`Locale set to: ${locale} from ${this.getLocale()}`)
        localStorage.setItem(localeLocalStorageKey, locale)
    }

    public static getLocale(): string {
        const localeString = localStorage.getItem(localeLocalStorageKey);

        if (localeString) {
            return localeString;
        } else {
            return 'en';
        }

    }
}