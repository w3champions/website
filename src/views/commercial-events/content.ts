import { en } from "./en";
import type { CommercialEventsContent } from "./types";
import { zh } from "./zh";

export type CommercialEventsLang = "en" | "zh";

/** Same invite URL as the Discord button in `components/common/SocialBox.vue`. */
export const DISCORD_URL = "https://discord.gg/uJmQxG2";

export const WECHAT_ID = "wxid_idapgslpx1ea12";

export const DISCORD_PROFILE_URL = "https://discord.com/users/686635854340554905";
export const DISCORD_CONTACT_NAME = "Faro";
export const DISCORD_USERNAME = "e.le.phant";

export const commercialEventsContent: Record<CommercialEventsLang, CommercialEventsContent> = { en, zh };

const toQueryLang = (value: unknown): CommercialEventsLang | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "zh" || raw === "en" ? raw : undefined;
};

/** A valid `?lang=` query value wins; otherwise any `zh*` site locale selects Chinese. */
export const resolveLang = (queryLang: unknown, locale: string): CommercialEventsLang => toQueryLang(queryLang) ?? (locale.toLowerCase().startsWith("zh") ? "zh" : "en");
