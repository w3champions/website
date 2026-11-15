import assert from "node:assert/strict";
import { test } from "vitest";
import type { EGameMode } from "@/store/types";
import { accountView, banSummary, banView, FIXTURE_NOW, fixtureModeName, SPEC_ACCOUNT } from "./fixtures.testing";
import { accountBoxInEffectText, accountBoxPastText, accountInEffectText, type BanEnd, inEffectTableOf, type OverlapDraft, overlapNotice, overlapText, remainingAfterRevokeText } from "./inEffect";
import { translateEn } from "./translate.testing";
import type { AccountView, BanSummary } from "./types";

const f = { t: translateEn, modeName: fixtureModeName, now: FIXTURE_NOW };

const at = (day: string) => `${day}T00:00:00.000Z`;
/** An account whose table has this global end (undefined: no global ban; null: permanent) and these mode ends. */
function acc(global: string | null | undefined, modes: Array<[EGameMode, string | null]>): AccountView {
  return accountView({
    counts: { total: 9, inEffect: 9, expired: 0, revoked: 0 },
    inEffect: { global: global === undefined ? null : { endDate: global, banId: "g", by: "ModOne#3001" }, modes: modes.map(([gameMode, endDate]) => ({ gameMode, endDate, banId: `m${gameMode}`, by: "ModOne#3001" })), bans: [] },
  });
}
const globalDraft: OverlapDraft = { kind: "regular", allGameModes: true, gameModes: [], end: null };
const modesDraft = (gameModes: EGameMode[], end: BanEnd | null): OverlapDraft => ({ kind: "regular", allGameModes: false, gameModes, end });
const machineDraft: OverlapDraft = { kind: "machine", allGameModes: true, gameModes: [], end: { permanent: true } };
const withBans = (...extra: BanSummary[]): AccountView => ({ ...SPEC_ACCOUNT, inEffect: { ...SPEC_ACCOUNT.inEffect, bans: [...SPEC_ACCOUNT.inEffect.bans, ...extra] } }); // these functions read only inEffect.bans
const one = accountView({ inEffect: { global: { endDate: at("2026-12-02"), banId: "ban1", by: "ModOne#3001" }, modes: [], bans: [banSummary()] } });

test("the worked example reads global first, then only the modes that outlast it", () => {
  assert.equal(accountInEffectText(SPEC_ACCOUNT, f), "Everything until 24 Nov · after that: Mode 1 permanent · Mode 2 until 8 Dec · Mode 3, Mode 4 until 27 Nov");
});
test("a mode ending exactly when the global ban ends is dropped", () => {
  assert.equal(accountInEffectText(acc(at("2026-11-24"), [[2, at("2026-11-24")]]), f), "Everything until 24 Nov");
});
test("a permanent global ban hides every mode", () => {
  assert.equal(accountInEffectText(acc(null, [[1, null]]), f), "Everything, permanent");
});
test("without a global ban the modes are listed alone", () => {
  assert.equal(accountInEffectText(acc(undefined, [[1, null], [2, at("2026-12-08")]]), f), "Mode 1 permanent · Mode 2 until 8 Dec");
});
test("at most 4 groups, then +N more", () => {
  const modes: Array<[EGameMode, string]> = [[1, at("2026-11-25")], [2, at("2026-11-26")], [3, at("2026-11-27")], [4, at("2026-11-28")], [5, at("2026-11-29")], [6, at("2026-11-30")]];
  assert.equal(accountInEffectText(acc(at("2026-11-24"), modes), f), "Everything until 24 Nov · after that: Mode 6 until 30 Nov · Mode 5 until 29 Nov · Mode 4 until 28 Nov · Mode 3 until 27 Nov · +2 more");
});
test("a single ban in effect is still stated", () => { // spec 9.3 item 8
  assert.equal(accountInEffectText(acc(at("2026-11-24"), []), f), "Everything until 24 Nov");
});
test("an end in another year shows the year", () => {
  assert.equal(accountInEffectText(acc(at("2027-01-05"), []), f), "Everything until 5 Jan 2027");
});
test("nothing in effect and no bans at all have their own sentences", () => {
  assert.equal(accountInEffectText(accountView({ counts: { total: 3, inEffect: 0, expired: 2, revoked: 1 } }), f), "No ban in effect on this account.");
  assert.equal(accountInEffectText(accountView(), f), "No bans on this account.");
});
test("inEffectTableOf matches the server's table for the same bans", () => {
  assert.deepEqual(inEffectTableOf(SPEC_ACCOUNT.inEffect.bans), SPEC_ACCOUNT.inEffect); // modes sorted by gameMode, latest end per slot, by = issuedBy, bans latest-ending first
});
test("what remains after revoking the global ban is the runner-up the table never had", () => {
  const second = banSummary({ banId: "g2", endDate: at("2026-11-21") });
  assert.equal(remainingAfterRevokeText(withBans(second), "g1", f), "After this, still in effect on this account: Everything until 21 Nov · after that: Mode 1 permanent · Mode 2 until 8 Dec · Mode 3, Mode 4 until 27 Nov");
});
test("revoking the only ban in effect leaves nothing", () => {
  assert.equal(remainingAfterRevokeText(one, "ban1", f), "After this, no ban remains in effect on this account.");
});
test("the account box in Edit leaves out the ban being edited", () => {
  assert.equal(accountBoxInEffectText(SPEC_ACCOUNT, "g1", f), "In effect on this account: Mode 1 permanent · Mode 2 until 8 Dec · Mode 3, Mode 4 until 27 Nov · Mode 1101 until 19 Nov");
  assert.equal(accountBoxInEffectText(one, "ban1", f), "In effect on this account: no ban");
  assert.equal(accountBoxInEffectText(one, undefined, f), "In effect on this account: Everything until 2 Dec");
});
test("the past line counts expired and revoked apart and describes the last expired ban", () => {
  const last = banView({ status: "expired", gameModes: [2], issuedAt: at("2026-10-01"), endDate: at("2026-10-08"), banReason: "x".repeat(50) });
  assert.equal(accountBoxPastText({ counts: { total: 35, inEffect: 0, expired: 28, revoked: 7 }, lastExpiredBan: last }, f), `Past: 28 expired · 7 revoked · last: Mode 2, 7 days, ended 8 Oct, “${"x".repeat(39)}…”`);
  assert.equal(accountBoxPastText({ counts: { total: 2, inEffect: 2, expired: 0, revoked: 0 }, lastExpiredBan: null }, f), null);
});
test("the past line covers an all-modes last ban, no last expired ban and a short reason", () => {
  const counts = { total: 9, inEffect: 0, expired: 3, revoked: 1 };
  const allModes = banView({ status: "expired", gameModes: [], issuedAt: at("2026-10-01"), endDate: at("2026-10-03"), banReason: "y".repeat(40) });
  assert.equal(accountBoxPastText({ counts, lastExpiredBan: allModes }, f), `Past: 3 expired · 1 revoked · last: All, 2 days, ended 3 Oct, “${"y".repeat(40)}”`);
  assert.equal(accountBoxPastText({ counts, lastExpiredBan: null }, f), "Past: 3 expired · 1 revoked");
});
test("two spellings of one end moment form one group", () => {
  assert.equal(accountInEffectText(acc(undefined, [[1, "2026-11-27T00:00:00.000Z"], [2, "2026-11-27T00:00:00Z"]]), f), "Mode 1, Mode 2 until 27 Nov");
});
test("a machine draft over a global ban gives the one machine line", () => {
  const n = overlapNotice(SPEC_ACCOUNT, machineDraft);
  assert.deepEqual(n, { kind: "machine", endDate: at("2026-11-24") });
  assert.equal(overlapText(n, f), "Already banned from everything until 24 Nov. The machine ban runs alongside.");
});
test("a machine draft with only mode bans in effect shows nothing", () => {
  const modeOnly = accountView({ inEffect: { global: null, modes: [], bans: [banSummary({ banId: "m2", gameModes: [2] })] } });
  assert.deepEqual(overlapNotice(modeOnly, machineDraft), { kind: "none" });
});
test("a global draft lists up to 3 bans, the global one first", () => {
  const n = overlapNotice(SPEC_ACCOUNT, globalDraft);
  assert.deepEqual(n.kind === "bans" && n.bans.map((b) => b.banId), ["g1", "m1", "m2"]);
  assert.equal(n.kind === "bans" && n.more, 2);
});
test("a mode draft lists only the bans covering a selected mode, with the shared modes", () => {
  const n = overlapNotice(SPEC_ACCOUNT, modesDraft([3], null));
  assert.deepEqual(n.kind === "bans" && n.bans.map((b) => [b.banId, b.gameModes]), [["g1", []], ["m34", [3]]]);
  assert.equal(n.kind === "bans" && n.more, 0);
});
test("the ban being edited is left out of the overlap", () => {
  const n = overlapNotice(SPEC_ACCOUNT, globalDraft, "g1");
  assert.deepEqual(n.kind === "bans" && n.bans.map((b) => b.banId), ["m1", "m2", "m34"]);
  assert.equal(n.kind === "bans" && n.more, 1);
});
test("adds nothing only when every selected mode is covered until at least the new end", () => {
  const addsNothing = (end: BanEnd | null) => {
    const n = overlapNotice(SPEC_ACCOUNT, modesDraft([2], end));
    return n.kind === "bans" && n.addsNothing;
  };
  assert.equal(addsNothing({ permanent: false, endDate: at("2026-11-30") }), true); // m2 ends 8 Dec
  assert.equal(addsNothing({ permanent: false, endDate: at("2026-12-12") }), false);
  assert.equal(addsNothing({ permanent: true }), false);
  assert.equal(addsNothing(null), false);
});
test("overlap text names the modes, the end and the author without #number", () => {
  assert.deepEqual(overlapText(overlapNotice(SPEC_ACCOUNT, modesDraft([3], null)), f), {
    heading: "Already banned:",
    lines: [{ banId: "g1", text: "Everything until 24 Nov (ModTwo)" }, { banId: "m34", text: "Mode 3 until 27 Nov (ModOne)" }],
    more: null,
    footer: "This ban runs alongside; it does not replace anything.",
  });
  const nothing = overlapText(overlapNotice(SPEC_ACCOUNT, modesDraft([2], { permanent: false, endDate: at("2026-11-30") })), f);
  assert.deepEqual(typeof nothing === "object" && nothing && [nothing.heading, nothing.footer], ["This adds nothing. Already banned:", null]);
  const all = overlapText(overlapNotice(SPEC_ACCOUNT, globalDraft), f);
  assert.equal(typeof all === "object" && all?.more, "+2 more");
});
test("no overlap gives no notice", () => {
  const n = overlapNotice(accountView(), globalDraft);
  assert.deepEqual(n, { kind: "none" });
  assert.equal(overlapText(n, f), null);
});
