import { EAdminRouteName } from "@/router/types";
import type { SmurfEventAttendeePresence, SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence, SmurfEventSideUse } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "./facts";
import { key, type Translate } from "./translate";

export type VenueRow = { source: "ip"; network: SmurfEventNetworkPresence } | { source: "item"; row: SmurfEventIdentifierRow };

/** The venue networks: those stored as IP hashes in the server's order, then the identifier table's network rows of any other kind. */
export function venueRows(presence: SmurfEventPresence | null, identifiers: SmurfEventIdentifiers | null): VenueRow[] {
  const ip = (presence?.networks ?? []).map((network): VenueRow => ({ source: "ip", network }));
  const items = (identifiers?.rows ?? []).filter((r) => r.roles.includes("network") && r.kind !== "ip").map((row): VenueRow => ({ source: "item", row }));
  return [...ip, ...items];
}

function notRecorded(tr: Translate): string {
  return tr(key("facts_not_recorded"));
}

/** "Before: 3 attendees, 2 other accounts, on 1 days"; every number reads "at least" when the side is capped. */
export function sideText(side: SmurfEventSideUse | undefined, sideKey: "before" | "during" | "after", tr: Translate): string {
  if (side === undefined) return notRecorded(tr);
  return tr(key(`venue_side_${sideKey}`), {
    attendees: factText(side.attendees, side.capped, tr),
    others: factText(side.others, side.capped, tr),
    days: factText(side.days, side.capped, tr),
  });
}

export function entryText(a: SmurfEventAttendeePresence, tr: Translate): string {
  return a.entry === undefined ? notRecorded(tr) : tr(key(`entry_${a.entry}`));
}

/** "venue / elsewhere (at home)"; not recorded unless both parts were read. */
export function loginsText(a: SmurfEventAttendeePresence, tr: Translate): string {
  if (a.venueLogins === undefined || a.elsewhere === undefined) return notRecorded(tr);
  return tr(key("logins_split"), { venue: a.venueLogins, elsewhere: a.elsewhere.logins, home: a.elsewhere.homeLogins });
}

export function switchText(a: SmurfEventAttendeePresence, tr: Translate): string {
  if (a.nearestSwitchMinutes !== undefined) return tr(key("switch_minutes"), { minutes: a.nearestSwitchMinutes });
  if (a.samePcRecorded === undefined) return notRecorded(tr);
  return tr(key(a.samePcRecorded ? "switch_none" : "switch_no_pc"));
}

/** The hardware page of an account. */
export function hardwareLink(battleTag: string): { name: EAdminRouteName; query: { player: string } } {
  return { name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: battleTag } };
}
