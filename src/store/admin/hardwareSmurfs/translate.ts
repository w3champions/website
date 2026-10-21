/** vue-i18n's `t` as the helpers need it: a key and named values. */
export type Translate = (key: string, named?: Record<string, string | number>) => string;

const PREFIX = "views_admin.hardware_smurfs";

/** The full key of a hardware smurf page text. */
export function key(name: string): string {
  return `${PREFIX}.${name}`;
}

/** The text of `name`, or `fallback` when the locale has no such key (vue-i18n answers the key itself). */
export function textOr(t: Translate, name: string, fallback: string, named?: Record<string, string | number>): string {
  const full = key(name);
  const text = t(full, named);
  return text === full ? fallback : text;
}
