import assert from "node:assert/strict";
import { test } from "vitest";
import { banBadgeOf } from "./badge";
import { banSummary, fixtureModeName, tagStatus } from "./fixtures.testing";
import { translateEn } from "./translate.testing";

const f = { t: translateEn, modeName: fixtureModeName, hasMachineAccess: true };
const summary = banSummary({ banId: "b1", gameModes: [], endDate: null, status: "inEffect", banReason: "Test reason one", issuedBy: "Helper(bot)" });

test("no badge without a ban", () => {
  assert.equal(banBadgeOf(undefined, f), null);
  assert.equal(banBadgeOf(tagStatus(), f), null);
  assert.equal(banBadgeOf(tagStatus({ state: "bannedNow", ban: null }), f), null);
});
test("what is in effect now: red, Banned, with the latest-ending ban's details", () => {
  assert.deepEqual(banBadgeOf(tagStatus({ state: "bannedNow", ban: { ...summary } }), f), {
    inEffect: true,
    label: "Banned",
    machine: false,
    reason: "Test reason one",
    until: "Permanent",
    by: "Helper(bot)",
    modes: "All game modes",
    status: "In effect",
  });
});
test("the last ban when none is in effect: grey, with expired or revoked", () => {
  const expired = banBadgeOf(
    tagStatus({ state: "bannedBefore", ban: { ...summary, status: "expired", endDate: "2026-10-01T00:00:00.000Z", gameModes: [2] } }),
    f,
  );
  assert.deepEqual(expired && [expired.inEffect, expired.label, expired.until, expired.modes], [false, "Banned (Expired)", "2026-10-01 00:00 UTC", "Mode 2"]);
  assert.equal(banBadgeOf(tagStatus({ state: "bannedBefore", ban: { ...summary, status: "revoked" } }), f)?.label, "Banned (Revoked)");
});
test("no machine marker without machine access, even when the server sent it", () => {
  const noAccess = { ...f, hasMachineAccess: false };
  assert.equal(banBadgeOf(tagStatus({ state: "bannedNow", ban: { ...summary }, machine: true }), noAccess)?.machine, false);
});
test("the machine marker only when the server sent it", () => {
  assert.equal(banBadgeOf(tagStatus({ state: "bannedNow", ban: { ...summary }, machine: true }), f)?.machine, true);
  assert.equal(banBadgeOf(tagStatus({ state: "bannedNow", ban: { ...summary } }), f)?.machine, false);
});
