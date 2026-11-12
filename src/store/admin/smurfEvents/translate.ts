import type { Translate } from "@/store/admin/hardwareSmurfs/translate";

export type { Translate };

const PREFIX = "views_admin.smurf_events";

/** The full key of a smurf events page text. */
export function key(name: string): string {
  return `${PREFIX}.${name}`;
}
