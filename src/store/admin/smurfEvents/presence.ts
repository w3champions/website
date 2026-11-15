import type { SmurfEventAttendeePresence, SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventNetworkPresence, SmurfEventPresence, SmurfEventSideUse } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { factText } from "./facts";
import { countText } from "./labels";
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

/** Nothing is recorded for the network: the server sent its hash and no measurement or context at all (not even "not read"). */
export function isUnmeasured(n: SmurfEventNetworkPresence): boolean {
  return n.notRead !== true && n.firstUseAt === undefined && n.lastUseAt === undefined && n.before === undefined && n.during === undefined && n.after === undefined && n.days === undefined && n.provider === undefined && n.country === undefined;
}

/**
 * One counted thing: "3 attendees" / "1 other account", "at least N" when `capped`, and, since "at least 0"
 * says nothing, "no attendee among those read" for a capped zero. `base` names the `_one` / `_other` / `_none_read` texts.
 */
function countedText(base: string, count: number, capped: true | undefined, tr: Translate): string {
  if (capped === true && count === 0) return tr(key(`${base}_none_read`));
  return tr(key(`${base}_${count === 1 ? "one" : "other"}`), { count: factText(count, capped, tr) });
}

/** "Before: 3 attendees, 2 other accounts, on 1 day"; every number reads "at least" when the side is capped. Null: the side is absent. */
export function sideText(side: SmurfEventSideUse | undefined, sideKey: "before" | "during" | "after", tr: Translate): string | null {
  if (side === undefined) return null;
  return tr(key(`venue_side_${sideKey}`), {
    attendees: countedText("venue_attendees", side.attendees, side.capped, tr),
    others: countedText("venue_others", side.others, side.capped, tr),
    days: countedText("venue_days", side.days, side.capped, tr),
  });
}

/** "On days outside the event: 1 attendee, at least 6 other accounts"; the attendee count is exact even on a capped row, only the other accounts are a lower bound. */
export function outsideText(holders: NonNullable<SmurfEventIdentifierRow["holdersOutside"]>, tr: Translate): string {
  return tr(key("venue_outside"), {
    attendees: countedText("venue_attendees", holders.attendees, undefined, tr),
    others: countedText("venue_others", holders.others, holders.capped, tr),
  });
}

/** How the attendee got in; null: not recorded. "Other" with no login read in the event's span says that instead of "neither". */
export function entryText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  if (a.entry === undefined) return null;
  if (a.entry === "other" && a.logins === 0) return tr(key("entry_no_login"));
  return tr(key(`entry_${a.entry}`));
}

/** "venue / elsewhere (on their usual network) · N other networks"; null unless both parts were read. */
export function loginsText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  if (a.venueLogins === undefined || a.elsewhere === undefined) return null;
  return tr(key("logins_split"), { venue: a.venueLogins, elsewhere: a.elsewhere.logins, home: a.elsewhere.homeLogins, networks: countText("logins_networks", a.elsewhere.networks, tr) });
}

/** The nearest switch on one PC, or why there is none; null: not recorded. */
export function switchText(a: SmurfEventAttendeePresence, tr: Translate): string | null {
  if (a.nearestSwitchMinutes !== undefined) return tr(key("switch_minutes"), { minutes: a.nearestSwitchMinutes });
  if (a.samePcRecorded === undefined) return null;
  return tr(key(a.samePcRecorded ? "switch_none" : "switch_no_pc"));
}

/** A recorded list: its items, or "None" when the server recorded it empty; "None among the attendees read" for an empty one when the spread covers only the attendees read. */
export function listText(values: readonly string[], tr: Translate, capped = false): string {
  if (values.length === 0) return tr(key(capped ? "spread_none_among_read" : "spread_none"));
  return values.join(", ");
}
