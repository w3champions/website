import { en } from "./en";
import type { CommercialEventsContent } from "./types";
import { zh } from "./zh";

export type CommercialEventsLang = "en" | "zh";

/** Same invite URL as the Discord button in `components/common/SocialBox.vue`. */
export const DISCORD_URL = "https://discord.gg/uJmQxG2";

export const WECHAT_ID = "w3c_faro";

/** Same absolute public-path style as `/assets/socials/...` in the rest of the site. */
export const WECHAT_QR_PATH = "/assets/commercial-events/wechat-faro-qr.png";
export const WECHAT_QR_WIDTH = 600;
export const WECHAT_QR_HEIGHT = 805;

export const DISCORD_PROFILE_URL = "https://discord.com/users/686635854340554905";
export const DISCORD_CONTACT_NAME = "Faro";
export const DISCORD_USERNAME = "e.le.phant";

export const commercialEventsContent: Record<CommercialEventsLang, CommercialEventsContent> = { en, zh };

/** Parses a `?lang=` query value (first entry when repeated); anything but `zh` or `en` is ignored. */
export const parseLangQuery = (value: unknown): CommercialEventsLang | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "zh" || raw === "en" ? raw : undefined;
};

/** The page language follows the site locale: any `zh*` locale selects Chinese, everything else English. */
export const resolveLang = (locale: string): CommercialEventsLang => locale.toLowerCase().startsWith("zh") ? "zh" : "en";
