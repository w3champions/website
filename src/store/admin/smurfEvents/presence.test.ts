import { expect, test } from "vitest";
import type { SmurfEventAttendeePresence, SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { entryText, isUnmeasured, listText, loginsText, outsideText, sideText, switchText, venueRowId, venueRows } from "./presence";
import { translateEn as tr } from "./translate.testing";

const WINDOW = { fromDay: 100, toDay: 118, eventFromDay: 105, eventToDay: 107 };

function presence(networks: SmurfEventPresence["networks"]): SmurfEventPresence {
  return { at: "2026-10-05T00:00:00.000Z", window: WINDOW, networks, attendees: [] };
}

function row(overrides: Partial<SmurfEventIdentifierRow>): SmurfEventIdentifierRow {
  return { hash8: "aaaa0001", kind: "router", roles: ["network"], keys: 1, alsoIn: [], ...overrides };
}

const attendee = (overrides: Partial<SmurfEventAttendeePresence>): SmurfEventAttendeePresence => ({ battleTag: "Guest#1003", ...overrides });

test("venueRows puts the IP networks first, then the router rows of the identifier table, never an IP row twice", () => {
  const identifiers: SmurfEventIdentifiers = {
    window: WINDOW,
    rows: [
      row({ hash8: "0a1b2c3d", kind: "ip" }),
      row({ hash8: "bbbb0002", kind: "V:disk", roles: ["machine"] }),
      row({ hash8: "cccc0003", kind: "router" }),
      row({ hash8: "dddd0004", kind: "router", roles: ["shared", "network"] }),
    ],
  };

  const rows = venueRows(presence([{ hash8: "0a1b2c3d" }, { hash8: "0a1b2c3e" }]), identifiers);

  expect(rows.map((r) => (r.source === "ip" ? `ip:${r.network.hash8}` : `item:${r.row.hash8}`))).toEqual(["ip:0a1b2c3d", "ip:0a1b2c3e", "item:cccc0003", "item:dddd0004"]);
});

test("venueRows without presence or identifiers gives what it has", () => {
  expect(venueRows(null, null)).toEqual([]);
  expect(venueRows(null, { window: WINDOW, rows: [row({})] })).toHaveLength(1);
  expect(venueRows(presence([{ hash8: "0a1b2c3d" }]), null)).toHaveLength(1);
});

test("sideText says the numbers of a side", () => {
  expect(sideText({ attendees: 3, others: 2, days: 1 }, "during", tr)).toBe("During: 3 attendees, 2 other accounts, on 1 day");
});

test("sideText uses the singular for exactly one and the plural for zero", () => {
  expect(sideText({ attendees: 1, others: 1, days: 1 }, "before", tr)).toBe("Before: 1 attendee, 1 other account, on 1 day");
  expect(sideText({ attendees: 0, others: 0, days: 0 }, "after", tr)).toBe("After: 0 attendees, 0 other accounts, on 0 days");
});

test("sideText never reads at least 0: a capped zero says none among those read", () => {
  expect(sideText({ attendees: 0, others: 2, days: 0, capped: true }, "after", tr)).toBe("After: no attendee among those read, at least 2 other accounts, on no day among the logins read");
  expect(sideText({ attendees: 1, others: 0, days: 1, capped: true }, "after", tr)).toBe("After: at least 1 attendee, no other account among those read, on at least 1 day");
});

test("outsideText keeps the attendees exact and the other accounts a lower bound when capped", () => {
  expect(outsideText({ attendees: 1, others: 6, capped: true }, tr)).toBe("On days outside the event: 1 attendee, at least 6 other accounts");
  expect(outsideText({ attendees: 2, others: 1 }, tr)).toBe("On days outside the event: 2 attendees, 1 other account");
  expect(outsideText({ attendees: 0, others: 0, capped: true }, tr)).toBe("On days outside the event: 0 attendees, no other account among those read");
});

test("sideText says at least for a capped side", () => {
  expect(sideText({ attendees: 3, others: 40, days: 2, capped: true }, "before", tr)).toBe("Before: at least 3 attendees, at least 40 other accounts, on at least 2 days");
});

test("sideText of an absent side is null", () => {
  expect(sideText(undefined, "after", tr)).toBeNull();
});

test("entryText names how each attendee got in and is null when absent", () => {
  expect(entryText(attendee({ entry: "network" }), tr)).toBe("On a venue network");
  expect(entryText(attendee({ entry: "pc" }), tr)).toBe("On a venue PC only");
  expect(entryText(attendee({ entry: "other" }), tr)).toBe("Neither a venue network nor a venue PC");
  expect(entryText(attendee({}), tr)).toBeNull();
});

test("entryText says no login during the event when other comes with no login read", () => {
  expect(entryText(attendee({ entry: "other", logins: 0 }), tr)).toBe("No login during the event");
  expect(entryText(attendee({ entry: "other", logins: 3 }), tr)).toBe("Neither a venue network nor a venue PC");
  expect(entryText(attendee({ entry: "network", logins: 0 }), tr)).toBe("On a venue network");
});

test("loginsText splits venue and elsewhere logins, and is null when either is absent", () => {
  expect(loginsText(attendee({ venueLogins: 4, elsewhere: { logins: 9, networks: 2, homeLogins: 7 } }), tr)).toBe("4 / 9 (7) · 2 other networks");
  expect(loginsText(attendee({ venueLogins: 4, elsewhere: { logins: 9, networks: 1, homeLogins: 7 } }), tr)).toBe("4 / 9 (7) · 1 other network");
  expect(loginsText(attendee({ venueLogins: 0, elsewhere: { logins: 0, networks: 0, homeLogins: 0 } }), tr)).toBe("0 / 0 (0) · 0 other networks");
  expect(loginsText(attendee({ venueLogins: 4 }), tr)).toBeNull();
  expect(loginsText(attendee({}), tr)).toBeNull();
});

test("switchText gives the minutes, or why there is none", () => {
  expect(switchText(attendee({ nearestSwitchMinutes: 12, samePcRecorded: true }), tr)).toBe("12 min");
  expect(switchText(attendee({ nearestSwitchMinutes: 0, samePcRecorded: true }), tr)).toBe("0 min");
  expect(switchText(attendee({ samePcRecorded: true }), tr)).toBe("None");
  expect(switchText(attendee({ samePcRecorded: false }), tr)).toBe("No PC recorded");
  expect(switchText(attendee({}), tr)).toBeNull();
});

test("listText joins a list, says None for an empty one", () => {
  expect(listText(["DE", "PL"], tr)).toBe("DE, PL");
  expect(listText([], tr)).toBe("None");
  expect(listText([], tr, true)).toBe("None among the attendees read");
  expect(listText(["DE"], tr, true)).toBe("DE");
  expect(listText(undefined, tr)).toBeNull();
  expect(listText(undefined, tr, true)).toBe("None among the attendees read");
});

test("venueRowId tells an IP network from an item of another kind with the same hash", () => {
  expect(venueRowId({ source: "ip", network: { hash8: "aaaa0001" } })).toBe("ip:aaaa0001");
  expect(venueRowId({ source: "item", row: row({ hash8: "aaaa0001" }) })).toBe("router:aaaa0001");
});

test("isUnmeasured is true only for a network with nothing recorded and not marked not read", () => {
  expect(isUnmeasured({ hash8: "a" })).toBe(true);
  expect(isUnmeasured({ hash8: "a", notRead: true })).toBe(false);
  expect(isUnmeasured({ hash8: "a", lastUseAt: "2026-10-01T00:00:00.000Z" })).toBe(false);
  expect(isUnmeasured({ hash8: "a", provider: "Example Telecom" })).toBe(false);
  expect(isUnmeasured({ hash8: "a", country: "DE" })).toBe(false);
  expect(isUnmeasured({ hash8: "a", days: [[1, 2]] })).toBe(false);
  expect(isUnmeasured({ hash8: "a", before: { attendees: 0, others: 0, days: 0 } })).toBe(false);
});
