import { test } from "vitest";
import { strict as assert } from "node:assert";
import { roleHintLines, roleHintsByBattleTag } from "./roleHints";
import type { RoleHints } from "./types";

const hints: RoleHints = {
  battleTag: "Foo#1",
  organizerOf: [{ allocationId: "a1", allocationName: "Spring cup" }, { allocationId: "a2", allocationName: "Weekly shows" }],
  delegateOf: [{ eventId: "EV-AB23", eventName: "Cup" }, { eventId: "EV-EF67", eventName: "Finals" }],
  hostOf: [{ eventId: "EV-CD45", eventName: "Show night" }],
};

test("roleHintLines reads exactly spec §10.3: allocation names for organizers, event ids only for delegates and hosts", () => {
  assert.deepEqual(roleHintLines(hints), [
    "Organizer in: Spring cup, Weekly shows",
    "Delegate in: EV-AB23, EV-EF67",
    "Host in: EV-CD45",
  ]);
});

test("roleHintLines is empty without roles, without hints and with null lists", () => {
  assert.deepEqual(roleHintLines({ battleTag: "Foo#1", organizerOf: [], delegateOf: [], hostOf: [] }), []);
  assert.deepEqual(roleHintLines(undefined), []);
  const nulls = { battleTag: "Foo#1", organizerOf: null, delegateOf: null, hostOf: null } as unknown as RoleHints;
  assert.deepEqual(roleHintLines(nulls), []);
});

test("roleHintsByBattleTag keys by the exact battle tag", () => {
  const map = roleHintsByBattleTag([hints, { ...hints, battleTag: "foo#1", organizerOf: [] }]);
  assert.equal(map["Foo#1"].organizerOf.length, 2);
  assert.equal(map["foo#1"].organizerOf.length, 0);
});
