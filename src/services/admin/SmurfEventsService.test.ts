import { test } from "vitest";
import { strict as assert } from "node:assert";
import { SmurfEventsApiError, SmurfEventsService } from "./SmurfEventsService";

const BASE = "https://api.example.com/api/admin/smurf-detection/events";

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function serviceWith(response: { status: number; body?: unknown }) {
  const calls: { url: string; method: string; body: unknown; auth: string | null }[] = [];
  const impl: typeof globalThis.fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    calls.push({
      url: urlOf(input),
      method: init?.method ?? "GET",
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
      auth: headers.get("Authorization"),
    });
    const body = response.body === undefined ? null : JSON.stringify(response.body);
    return Promise.resolve(new Response(body, { status: response.status, headers: body === null ? undefined : { "Content-Type": "application/json" } }));
  };
  return { calls, service: new SmurfEventsService({ endpoint: "https://api.example.com/", fetch: impl }) };
}

const REQUEST = { name: "LAN party", from: "2026-10-01T00:00:00.000Z", to: "2026-10-03T00:00:00.000Z", anchors: ["Anchor#1001", "Anchor#1002"] };

test("list sends the filters and cursor as encoded query parameters, and nothing when unset", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { events: [] } });

  await service.list("tok", { review: "unreviewed", origin: "manual", cursor: "a b/c", limit: 50 });
  await service.list("tok", {});

  assert.equal(calls[0].url, `${BASE}?review=unreviewed&origin=manual&cursor=a%20b%2Fc&limit=50`);
  assert.equal(calls[0].auth, "Bearer tok");
  assert.equal(calls[1].url, BASE);
});

test("get and denyPreview encode the id", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.get("tok", "ev/1");
  await service.denyPreview("tok", "ev/1");

  assert.equal(calls[0].url, `${BASE}/ev%2F1`);
  assert.equal(calls[1].url, `${BASE}/ev%2F1/deny-preview`);
});

test("preview, create, update and review send their bodies without an author", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.preview("tok", REQUEST);
  await service.create("tok", { ...REQUEST, reason: "known LAN" });
  await service.update("tok", "ev1", REQUEST);
  await service.review("tok", "ev1", { decision: "denied", reason: "not an event" });

  assert.deepEqual(calls.map((c) => [c.method, c.url]), [
    ["POST", `${BASE}/preview`],
    ["POST", BASE],
    ["PUT", `${BASE}/ev1`],
    ["POST", `${BASE}/ev1/review`],
  ]);
  assert.deepEqual(calls[0].body, REQUEST);
  assert.deepEqual(calls[1].body, { ...REQUEST, reason: "known LAN" });
  assert.deepEqual(calls[3].body, { decision: "denied", reason: "not an event" });
  assert.ok(calls.every((c) => !Object.hasOwn(c.body as object, "author")));
});

test("remove sends DELETE with the reason and accepts a 204", async () => {
  const { service, calls } = serviceWith({ status: 204 });

  await service.remove("tok", "ev1", "duplicate");

  assert.equal(calls[0].method, "DELETE");
  assert.equal(calls[0].url, `${BASE}/ev1`);
  assert.deepEqual(calls[0].body, { reason: "duplicate" });
});

test("a refused create keeps the status, the server message and the parsed body", async () => {
  const preview = { networks: [], excluded: [], counts: { machines: 0, attendees: 0 }, endsLinks: [], refused: "no-venue" };
  const { service } = serviceWith({ status: 422, body: { error: "Refused", preview } });

  const error = await service.create("tok", REQUEST).catch((e: unknown) => e);

  assert.ok(error instanceof SmurfEventsApiError);
  assert.equal(error.status, 422);
  assert.equal(error.serverMessage, "Refused");
  assert.deepEqual(error.body, { error: "Refused", preview });
});

test("an error body that is not JSON leaves the message and body null", async () => {
  const impl: typeof globalThis.fetch = () => Promise.resolve(new Response("<html>bad gateway</html>", { status: 502 }));
  const service = new SmurfEventsService({ endpoint: "https://api.example.com/", fetch: impl });

  const error = await service.get("tok", "ev1").catch((e: unknown) => e);

  assert.ok(error instanceof SmurfEventsApiError);
  assert.equal(error.status, 502);
  assert.equal(error.serverMessage, null);
  assert.equal(error.body, null);
});

test("a create tells a new event (201) from an existing one (200)", async () => {
  const created = serviceWith({ status: 201, body: { id: "ev1" } });
  const existing = serviceWith({ status: 200, body: { id: "ev1" } });

  assert.deepEqual(await created.service.create("tok", REQUEST), { event: { id: "ev1" }, existing: false });
  assert.deepEqual(await existing.service.create("tok", REQUEST), { event: { id: "ev1" }, existing: true });
});

test("a delete answered 204 succeeds", async () => {
  const { service } = serviceWith({ status: 204 });

  await service.remove("tok", "ev1", "duplicate");
});

const NOW = Date.parse("2026-11-10T12:00:00Z");

async function retryAfterOf(header: string | null): Promise<number | null> {
  const impl: typeof globalThis.fetch = () => Promise.resolve(new Response("{}", { status: 429, headers: header === null ? undefined : { "Retry-After": header } }));
  const service = new SmurfEventsService({ endpoint: "https://api.example.com/", fetch: impl }, () => NOW);
  const error = await service.get("tok", "ev1").catch((e: unknown) => e);
  assert.ok(error instanceof SmurfEventsApiError);
  return error.retryAfterSeconds;
}

test("a Retry-After in seconds lands on the error", async () => {
  assert.equal(await retryAfterOf("30"), 30);
});

test("a Retry-After HTTP date is converted with the injected clock, rounded up to whole seconds", async () => {
  assert.equal(await retryAfterOf("Tue, 10 Nov 2026 12:00:45 GMT"), 45);
  assert.equal(await retryAfterOf(new Date(NOW + 1500).toUTCString()), 1);
});

test("an absent, malformed or not positive Retry-After leaves the error without a wait", async () => {
  for (const header of [null, "", "soon", "-5", "0", "1.5", "12 seconds", "Mon, 09 Nov 2026 12:00:00 GMT", "Tue, 10 Nov 2026 12:00:00 GMT"]) {
    assert.equal(await retryAfterOf(header), null, `header ${String(header)}`);
  }
});

test("rename, identifiers and history use their routes; identifiers never sends a reveal parameter", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.rename("tok", "ev/1", { name: "Sofia LAN", reason: "named by the venue" });
  await service.identifiers("tok", "ev/1");
  await service.history("tok", "ev/1");

  assert.deepEqual(calls.map((c) => [c.method, c.url]), [
    ["POST", `${BASE}/ev%2F1/rename`],
    ["GET", `${BASE}/ev%2F1/identifiers`],
    ["GET", `${BASE}/ev%2F1/history`],
  ]);
  assert.deepEqual(calls[0].body, { name: "Sofia LAN", reason: "named by the venue" });
  assert.ok(!calls[1].url.includes("reveal"));
});

test("review sends the name when given", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.review("tok", "ev1", { decision: "confirmed", name: "Sofia LAN" });

  assert.deepEqual(calls[0].body, { decision: "confirmed", name: "Sofia LAN" });
});
