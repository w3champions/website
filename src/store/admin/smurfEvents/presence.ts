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

/** Stable key of a venue row: an IP network and an item of another kind may share a hash. */
export function venueRowId(v: VenueRow): string {
  return v.source === "ip" ? `ip:${v.network.hash8}` : `${v.row.kind}:${v.row.hash8}`;
}

/** Nothing is recorded for the network: the server sent its hash and no measurement at all (not even "not read"). */
export function isUnmeasured(n: SmurfEventNetworkPresence): boolean {
  return n.notRead !== true && n.firstUseAt === undefined && n.lastUseAt === undefined && n.before === undefined && n.during === undefined && n.after === undefined;
}

/** "Before: 3 attendees, 2 other accounts, on 1 days"; every number reads "at least" when the side is capped. Null: the side is absent. */
export function sideText(side: SmurfEventSideUse | undefined, sideKey: "before" | "during" | "after", tr: Translate): string | null {
  if (side === undefined) return null;
  return tr(key(`venue_side_${sideKey}`), {
    attendees: factText(side.attendees, side.capped, tr),
    others: factText(side.others, side.capped, tr),
    days: factText(side.days, side.capped, tr),
  });
}

/** How the attendee got in; null: not recorded. */
export function entryText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  return a.entry === undefined ? null : tr(key(`entry_${a.entry}`));
}

/** "venue / elsewhere (at home)"; null unless both parts were read. */
export function loginsText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  if (a.venueLogins === undefined || a.elsewhere === undefined) return null;
  return tr(key("logins_split"), { venue: a.venueLogins, elsewhere: a.elsewhere.logins, home: a.elsewhere.homeLogins });
}

/** The nearest switch on one PC, or why there is none; null: not recorded. */
export function switchText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  if (a.nearestSwitchMinutes !== undefined) return tr(key("switch_minutes"), { minutes: a.nearestSwitchMinutes });
  if (a.samePcRecorded === undefined) return null;
  return tr(key(a.samePcRecorded ? "switch_none" : "switch_no_pc"));
}

/** A recorded list: its items, or "None" when the server recorded it empty. */
export function listText(values: readonly string[], tr: Translate): string {
  return values.length === 0 ? tr(key("spread_none")) : values.join(", ");
}

/** The hardware page of an account. */
export function hardwareLink(battleTag: string): { name: EAdminRouteName; query: { player: string } } {
  return { name: EAdminRouteName.SMURF_CHECKER_HARDWARE_LINKS, query: { player: battleTag } };
}
