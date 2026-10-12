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
