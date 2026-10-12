import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HttpError } from "@/services/http/AuthorizedClient";
import { describeNetDiagError } from "./errors";

function httpError(status: number, body: unknown): HttpError {
  return new HttpError(status, "POST", "https://api.example.com/api/network-diagnostics/runs", typeof body === "string" ? body : JSON.stringify(body));
}

test("unknown BattleTags are listed exactly as the backend returned them", () => {
  const message = describeNetDiagError(httpError(400, { error: "unknown_battletags", battleTags: ["Ghost#1234", "ghost#1234"] }));
  assert.equal(message, "Unknown players: Ghost#1234, ghost#1234");
});

test("an unknown-players body without any tag falls back to the 400 text", () => {
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_battletags", battleTags: [] })), "Rejected: unknown_battletags");
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_battletags", battleTags: [1, null] })), "Rejected: unknown_battletags");
});

test("other 400s show the backend's error text", () => {
  assert.equal(describeNetDiagError(httpError(400, { error: "windowSeconds must be 30-300" })), "Rejected: windowSeconds must be 30-300");
});

test("status codes without a useful body get plain admin copy", () => {
  assert.equal(describeNetDiagError(httpError(401, "")), "Your session has expired. Log in again.");
  assert.equal(describeNetDiagError(httpError(403, "")), "You need the Proxies permission for network diagnostics.");
  assert.equal(describeNetDiagError(httpError(404, "")), "Not found.");
  assert.equal(describeNetDiagError(httpError(409, "")), "This run is already cancelled.");
  assert.equal(describeNetDiagError(httpError(502, { error: "mm down" })), "The matchmaking service could not be reached. Try again.");
  assert.equal(describeNetDiagError(httpError(503, { error: "netdiag_disabled" })), "Request failed (HTTP 503).");
  assert.equal(describeNetDiagError(httpError(500, "<html>boom</html>")), "Request failed (HTTP 500).");
});

test("a 409 whose body names a code shows that code", () => {
  assert.equal(describeNetDiagError(httpError(409, { error: "run_closed" })), "Conflict: run_closed");
});

test("non-HTTP failures keep their message", () => {
  assert.equal(describeNetDiagError(new TypeError("Failed to fetch")), "Failed to fetch");
  assert.equal(describeNetDiagError("weird"), "weird");
});

test("a 401 with the permission body names the missing Proxies permission, not an expired session", () => {
  assert.equal(describeNetDiagError(httpError(401, { error: "Permission missing." })), "You need the Proxies permission for network diagnostics.");
});

test("an expired token or any other 401 reads as an expired session", () => {
  assert.equal(describeNetDiagError(httpError(401, { statusCode: 401, error: "AUTH_TOKEN_EXPIRED", message: "Token expired." })), "Your session has expired. Log in again.");
  assert.equal(describeNetDiagError(httpError(401, { error: "Invalid token" })), "Your session has expired. Log in again.");
  assert.equal(describeNetDiagError(httpError(401, "IDX12729: garbage")), "Your session has expired. Log in again.");
});

test("a 409 for an already cancelled run reads naturally; other codes stay visible", () => {
  assert.equal(describeNetDiagError(httpError(409, { error: "already_cancelled" })), "This run is already cancelled.");
  assert.equal(describeNetDiagError(httpError(409, { error: "something_else" })), "Conflict: something_else");
});

test("unknown targets and flo nodes are listed like unknown players", () => {
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_targets", targetKeys: ["core:nope", "baseline:<b>x</b>"] })), "Unknown targets: core:nope, baseline:<b>x</b>");
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_flo_nodes", floNodeIds: [7, 12] })), "Unknown flo nodes: 7, 12");
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_targets", targetKeys: [] })), "Rejected: unknown_targets");
  assert.equal(describeNetDiagError(httpError(400, { error: "unknown_flo_nodes" })), "Rejected: unknown_flo_nodes");
});

test("a 503 query timeout asks for narrower filters; any other 503 keeps the generic text", () => {
  // Real body of website-backend 96a5422b when a query exceeds its time limit.
  assert.equal(describeNetDiagError(httpError(503, { error: "query_timeout" })), "The query took too long. Narrow the filters or the time range and try again.");
  assert.equal(describeNetDiagError(httpError(503, "")), "Request failed (HTTP 503).");
});
