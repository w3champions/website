import type { Translate } from "@/store/admin/hardwareSmurfs/translate";

export type { Translate } from "@/store/admin/hardwareSmurfs/translate";

/** The sheet location (and `data.ts` block) of the bans page texts. */
export const BANS_LOCATION = "views_admin_bans";

/** The full key of a bans page text. */
export function key(name: string): string {
  return `${BANS_LOCATION}.${name}`;
}

/** `base_one` / `base_other` chosen by `count`, with `{count}` filled in next to any `named` values. */
export function countText(base: string, count: number, t: Translate, named?: Record<string, string | number>): string {
  return t(key(`${base}_${count === 1 ? "one" : "other"}`), { ...named, count });
}
