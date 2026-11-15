import { expect, test } from "vitest";
import type { SmurfEventAttendeePresence, SmurfEventIdentifierRow, SmurfEventIdentifiers, SmurfEventPresence } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { entryText, loginsText, sideText, switchText, venueRows } from "./presence";
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
  expect(sideText({ attendees: 3, others: 2, days: 1 }, "during", tr)).toBe("During: 3 attendees, 2 other accounts, on 1 days");
});

test("sideText says at least for a capped side", () => {
  expect(sideText({ attendees: 3, others: 40, days: 2, capped: true }, "before", tr)).toBe("Before: at least 3 attendees, at least 40 other accounts, on at least 2 days");
});

test("sideText of an absent side says Not recorded", () => {
  expect(sideText(undefined, "after", tr)).toBe("Not recorded");
});

test("entryText names how each attendee got in and says Not recorded when absent", () => {
  expect(entryText(attendee({ entry: "network" }), tr)).toBe("On a venue network");
  expect(entryText(attendee({ entry: "pc" }), tr)).toBe("On a venue PC only");
  expect(entryText(attendee({ entry: "other" }), tr)).toBe("Neither");
  expect(entryText(attendee({}), tr)).toBe("Not recorded");
});

test("loginsText splits venue and elsewhere logins, and says Not recorded when either is absent", () => {
  expect(loginsText(attendee({ venueLogins: 4, elsewhere: { logins: 9, networks: 2, homeLogins: 7 } }), tr)).toBe("4 / 9 (7)");
  expect(loginsText(attendee({ venueLogins: 0, elsewhere: { logins: 0, networks: 0, homeLogins: 0 } }), tr)).toBe("0 / 0 (0)");
  expect(loginsText(attendee({ venueLogins: 4 }), tr)).toBe("Not recorded");
  expect(loginsText(attendee({}), tr)).toBe("Not recorded");
});

test("switchText gives the minutes, or why there is none", () => {
  expect(switchText(attendee({ nearestSwitchMinutes: 12, samePcRecorded: true }), tr)).toBe("12 min");
  expect(switchText(attendee({ nearestSwitchMinutes: 0, samePcRecorded: true }), tr)).toBe("0 min");
  expect(switchText(attendee({ samePcRecorded: true }), tr)).toBe("No switch on one PC");
  expect(switchText(attendee({ samePcRecorded: false }), tr)).toBe("No PC recorded");
  expect(switchText(attendee({}), tr)).toBe("Not recorded");
});
