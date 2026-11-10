import en from "@/locales/en";
import type { Translate } from "./translate";

const messages: Record<string, string> = en.views_admin.smurf_events;

/** A `t` over the English page texts, for tests: answers the key for a missing text, as vue-i18n does. */
export const translateEn: Translate = (fullKey, named) => {
  const name = fullKey.replace(/^views_admin\.smurf_events\./, "");
  const text = Object.hasOwn(messages, name) ? messages[name] : undefined;
  if (text === undefined) return fullKey;
  return text.replace(/\{(\w+)\}/g, (match, param: string) => (named && param in named ? String(named[param]) : match));
};
