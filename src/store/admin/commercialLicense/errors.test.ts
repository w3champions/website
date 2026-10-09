import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { describeError } from "./errors";

const http = (status: number, body: string) => new HttpError(status, "PUT", "https://x/api/y", body);

test("uses the backend error reason", () => {
  assert.equal(describeError(http(400, JSON.stringify({ error: "invalid_battletag" }))), "invalid_battletag");
});

test("maps 403 to the permission message", () => {
  assert.equal(describeError(http(403, "")), "You don't have the CommercialLicense permission.");
});

test("falls back to the status for an empty or non-JSON body", () => {
  assert.equal(describeError(http(500, "")), "Request failed (HTTP 500)");
  assert.equal(describeError(http(502, "<html>")), "Request failed (HTTP 502)");
});

test("falls back when the JSON has no usable error", () => {
  assert.equal(describeError(http(400, "null")), "Request failed (HTTP 400)");
  assert.equal(describeError(http(400, JSON.stringify({ error: 5 }))), "Request failed (HTTP 400)");
});

test("non-HTTP errors keep their message", () => {
  assert.equal(describeError(new Error("network down")), "network down");
  assert.equal(describeError("oops"), "oops");
});
