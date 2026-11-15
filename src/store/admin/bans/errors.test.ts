import assert from "node:assert/strict";
import { test } from "vitest";
import { BanApiError, banApiErrorOf } from "@/services/admin/banApiError";
import { banErrorText, blocksRetry, mayHaveBeenSaved } from "./errors";
import { translateEn as t } from "./translate.testing";

test("the machine-ban refusal shows the contract's fixed text", () => {
  assert.equal(banErrorText(new BanApiError(403, "MACHINE_BAN_PERMISSION", "refused"), t), "Permission denied, please contact an Administrator");
});
test("a conflict and a ban that ended meanwhile get readable texts", () => {
  assert.equal(banErrorText(new BanApiError(409, "BAN_VERSION_CONFLICT", "version"), t), "Someone else changed this ban while you had it open. Nothing was saved. Close this dialog and open the ban again to see the change.");
  assert.equal(banErrorText(new BanApiError(409, "BAN_NOT_IN_EFFECT", "x"), t), "This ban is no longer in effect: it ended or was revoked while you had it open. Nothing was saved.");
  assert.equal(banErrorText(new BanApiError(503, "BANS_UNAVAILABLE", ""), t), "Bans are not available right now. Please tell an administrator.");
  assert.equal(banErrorText(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "x"), t), "Machine data is not available right now, so nothing with machine IDs can be read or saved. Regular bans still work. Try again later.");
});
test("not found codes", () => {
  assert.equal(banErrorText(new BanApiError(404, "BAN_NOT_FOUND", "x"), t), "This ban no longer exists.");
  assert.equal(banErrorText(new BanApiError(404, "PLAYER_NOT_FOUND", "x"), t), "Player not found. Check the BattleTag.");
});
test("only a validation refusal shows the server's text", () => {
  assert.equal(banErrorText(new BanApiError(400, "VALIDATION", "endDate must be in the future"), t), "endDate must be in the future");
  assert.equal(banErrorText(new BanApiError(400, "VALIDATION", ""), t), "The request failed. Please try again.");
  assert.equal(banErrorText(new BanApiError(500, undefined, "NullReferenceException at …"), t), "The request failed. Please try again.");
});
test("website-backend's own refusals map to fixed texts", () => {
  assert.equal(banErrorText(banApiErrorOf(401, JSON.stringify({ error: "Permission missing." })), t), "You do not have permission to do this.");
  assert.equal(banErrorText(new BanApiError(403, undefined, ""), t), "You do not have permission to do this.");
  assert.equal(banErrorText(banApiErrorOf(502, JSON.stringify({ error: "Matchmaking service unavailable" })), t), "The ban service cannot be reached right now. Please try again in a moment.");
  assert.equal(banErrorText(new TypeError("Failed to fetch"), t), "The request failed. Please try again.");
});
test("only a 4xx or a coded refusal proves a write was refused", () => {
  assert.equal(mayHaveBeenSaved(new BanApiError(409, "BAN_VERSION_CONFLICT", "")), false);
  assert.equal(mayHaveBeenSaved(banApiErrorOf(401, JSON.stringify({ error: "Permission missing." }))), false);
  assert.equal(mayHaveBeenSaved(banApiErrorOf(502, JSON.stringify({ error: "Matchmaking service unavailable" }))), true);
  assert.equal(mayHaveBeenSaved(new BanApiError(504, undefined, "")), true);
  assert.equal(mayHaveBeenSaved(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "")), false);
  assert.equal(mayHaveBeenSaved(new BanApiError(503, "BANS_UNAVAILABLE", "")), false);
  assert.equal(mayHaveBeenSaved(new TypeError("Failed to fetch")), true);
});
test("errors after which Save stays disabled", () => {
  for (const code of ["MACHINE_BAN_PERMISSION", "BAN_VERSION_CONFLICT", "BAN_NOT_IN_EFFECT", "BAN_NOT_FOUND"] as const) assert.equal(blocksRetry(new BanApiError(409, code, "")), true);
  assert.equal(blocksRetry(new TypeError("Failed to fetch")), true);
  assert.equal(blocksRetry(new BanApiError(400, "VALIDATION", "x")), false);
  assert.equal(blocksRetry(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "")), false);
});
