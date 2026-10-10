import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { describeCommercialEventsError, ruleText } from "./errors";

const http = (status: number, body: unknown) => new HttpError(status, "POST", "https://x/api/admin/commercial-events/events", typeof body === "string" ? body : JSON.stringify(body));

test("INVALID_FIELD names the field and the event name limit", () => {
  const e = http(400, { error: "name: too-long", code: "INVALID_FIELD", field: "name", rule: "too-long" });
  assert.equal(describeCommercialEventsError(e, "event"), "Name: Use at most 32 characters.");
});

test("INVALID_FIELD uses the allocation name limit in the allocation context", () => {
  const e = http(400, { error: "name: too-long", code: "INVALID_FIELD", field: "name", rule: "too-long" });
  assert.equal(describeCommercialEventsError(e, "allocation"), "Name: Use at most 60 characters.");
});

test("out-of-range texts depend on the field", () => {
  assert.equal(ruleText("prizePoolUsd", "out-of-range"), "Enter an amount from 0 to 10,000,000.");
  assert.equal(ruleText("maxGames", "out-of-range"), "Enter a number from 1 to 10,000.");
  assert.equal(ruleText("gamesPerPeriod", "out-of-range"), "Enter a number from 1 to 100,000.");
  assert.equal(ruleText("limit", "out-of-range"), "Enter a number from 1 to 50.");
});

test("admin-only rules have English texts", () => {
  assert.equal(ruleText("startsAt", "immutable"), "This can't be changed after the allocation has started.");
  assert.equal(ruleText("adminNote", "too-long"), "Use at most 2,000 characters.");
  assert.equal(ruleText("suspensionMessage", "too-long", "suspension"), "Use at most 500 characters.");
  assert.equal(ruleText("suspensionMessage", "required", "suspension"), "Enter a message.");
  assert.equal(ruleText("maxGames", "below-used"), "The game limit can't be lower than the games already used or in progress.");
});

test("INVALID_REQUEST names the field, or the request when the field is null or absent", () => {
  assert.equal(describeCommercialEventsError(http(400, { error: "startsAt: invalid", code: "INVALID_REQUEST", field: "startsAt" })), "Start: invalid value.");
  assert.equal(describeCommercialEventsError(http(400, { error: "body: invalid", code: "INVALID_REQUEST", field: null })), "Request: invalid value.");
  assert.equal(describeCommercialEventsError(http(400, { error: "body: invalid", code: "INVALID_REQUEST" })), "Request: invalid value.");
  // website-backend's own path-segment guard uses the same shape (backend plan Task 5).
  assert.equal(describeCommercialEventsError(http(400, { error: "matchId: invalid", code: "INVALID_REQUEST", field: "matchId" })), "Match: invalid value.");
});

test("INVALID_REQUEST labels the list filters and the audit query", () => {
  assert.equal(describeCommercialEventsError(http(400, { error: "status: invalid", code: "INVALID_REQUEST", field: "status" })), "Status: invalid value.");
  assert.equal(describeCommercialEventsError(http(400, { error: "phase: invalid", code: "INVALID_REQUEST", field: "phase" })), "Phase: invalid value.");
  assert.equal(describeCommercialEventsError(http(400, { error: "query: invalid", code: "INVALID_REQUEST", field: "query" })), "Search audit log: invalid value.");
});

test("UNKNOWN_BATTLE_TAG repeats the exact battle tag", () => {
  const e = http(400, { error: "UNKNOWN_BATTLE_TAG", code: "UNKNOWN_BATTLE_TAG", data: { battleTag: "FooBar#1234" } });
  assert.equal(describeCommercialEventsError(e), "No W3Champions player found for FooBar#1234. Check the spelling and capitalization.");
});

test("ROLE_EXISTS names the existing role", () => {
  const e = http(409, { error: "ROLE_EXISTS", code: "ROLE_EXISTS", data: { battleTag: "Foo#1", role: "host" } });
  // dprint prefers single quotes for strings containing double quotes; eslint wants double.
  // eslint-disable-next-line @stylistic/quotes
  assert.equal(describeCommercialEventsError(e), 'Foo#1 already has the role "Authorized host" here. Remove it first to change it.');
});

test("TERMINATE_FAILED includes the cancel error", () => {
  const e = http(409, { error: "TERMINATE_FAILED", code: "TERMINATE_FAILED", data: { message: "Game not found on flo" } });
  assert.equal(describeCommercialEventsError(e), "The game couldn't be terminated: Game not found on flo");
});

test("admin-only codes map to admin copy", () => {
  assert.equal(
    describeCommercialEventsError(http(409, { error: "ALLOCATION_IN_USE", code: "ALLOCATION_IN_USE" })),
    "This allocation has been used and can't be deleted. Use End now instead.",
  );
  assert.equal(describeCommercialEventsError(http(409, { error: "EVENT_CLOSED", code: "EVENT_CLOSED" })), "This event is closed. Closed events can't be changed.");
  assert.equal(describeCommercialEventsError(http(404, { error: "UNKNOWN_GAME", code: "UNKNOWN_GAME" })), "This game is no longer in progress.");
  assert.equal(describeCommercialEventsError(http(409, { error: "ALLOCATION_INACTIVE", code: "ALLOCATION_INACTIVE" })), "Only an active allocation can be ended now.");
});

test("an unknown code falls back to the error text", () => {
  assert.equal(describeCommercialEventsError(http(409, { error: "Something new", code: "BRAND_NEW" })), "Something new");
});

test("website-backend's own model-binding 400 (ProblemDetails) falls back to its title", () => {
  const problem = { type: "https://tools.ietf.org/html/rfc9110#section-15.5.1", title: "One or more validation errors occurred.", status: 400, errors: { "$": ["x"] } };
  assert.equal(describeCommercialEventsError(http(400, problem)), "One or more validation errors occurred.");
});

test("a body without JSON falls back to the HTTP status", () => {
  assert.equal(describeCommercialEventsError(http(502, "<html>")), "Request failed (HTTP 502)");
  assert.equal(describeCommercialEventsError(http(500, "")), "Request failed (HTTP 500)");
});

test("401 from the permission filter: missing permission or expired session", () => {
  assert.equal(describeCommercialEventsError(http(401, { error: "Permission missing." })), "You don't have the CommercialLicense permission.");
  assert.equal(describeCommercialEventsError(http(401, { statusCode: 401, error: "AUTH_TOKEN_EXPIRED", message: "Token expired." })), "Your session has expired. Log in again.");
});

test("403 is the matchmaking admin-secret refusal passed through", () => {
  assert.equal(
    describeCommercialEventsError(http(403, { errors: [{ msg: "Permission denied" }] })),
    "The matchmaking service refused the request (admin secret). Contact a developer.",
  );
});

test("non-HTTP errors keep their message", () => {
  assert.equal(describeCommercialEventsError(new Error("network down")), "network down");
  assert.equal(describeCommercialEventsError("oops"), "oops");
});
