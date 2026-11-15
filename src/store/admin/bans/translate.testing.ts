import data from "@/locales/data";
import { BANS_LOCATION, type Translate } from "./translate";

const messages: Record<string, string> = data.en.views_admin_bans;
const PREFIX = `${BANS_LOCATION}.`;

/** A `t` over the English bans page texts, for tests: answers the key for a missing text, as vue-i18n does. */
export const translateEn: Translate = (fullKey, named) => {
  const name = fullKey.startsWith(PREFIX) ? fullKey.slice(PREFIX.length) : fullKey;
  const text = Object.hasOwn(messages, name) ? messages[name] : undefined;
  if (text === undefined) return fullKey;
  return text.replace(/\{(\w+)\}/g, (match, param: string) => (named && param in named ? String(named[param]) : match));
};
