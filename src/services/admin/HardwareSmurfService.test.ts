import { test } from "vitest";
import { strict as assert } from "node:assert";
import { HardwareSmurfApiError, HardwareSmurfService, serverMessageOf } from "./HardwareSmurfService";

const BASE = "https://api.example.com/api/admin/smurf-detection";

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
  return { calls, service: new HardwareSmurfService({ endpoint: "https://api.example.com/", fetch: impl }) };
}

test("getLinks encodes the battleTag and sends the bearer token", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { battleTag: "Foo#123", generation: null, raw: [] } });

  const result = await service.getLinks("tok", "Foo#123");

  assert.equal(calls[0].url, `${BASE}/hardware/links/Foo%23123`);
  assert.equal(calls[0].method, "GET");
  assert.equal(calls[0].auth, "Bearer tok");
  assert.deepEqual(result.raw, []);
});

test("getItems and getItem encode every path segment", async () => {
  const { service, calls } = serviceWith({ status: 200, body: {} });

  await service.getItems("tok", "Foo#123");
  await service.getItem("tok", "Foo#123", "0a1b2c3d");

  assert.equal(calls[0].url, `${BASE}/hardware/items/Foo%23123`);
  assert.equal(calls[1].url, `${BASE}/hardware/items/Foo%23123/0a1b2c3d`);
});

test("getAudit passes battleTag, before and limit as encoded query parameters", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { entries: [], next: null } });

  await service.getAudit("tok", { battleTag: "Foo#123", before: "2026-10-01T10:00:00.000Z", limit: 50 });
  await service.getAudit("tok", { battleTag: "Foo#123" });

  assert.equal(calls[0].url, `${BASE}/hardware/audit?battleTag=Foo%23123&before=2026-10-01T10%3A00%3A00.000Z&limit=50`);
  assert.equal(calls[1].url, `${BASE}/hardware/audit?battleTag=Foo%23123`);
});

test("pair verdicts POST only the reason and DELETE without a body", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { message: "ok" } });

  await service.setSmurf("tok", "A#1", "B#2", "same person");
  await service.revokeSmurf("tok", "A#1", "B#2");
  await service.setNotSmurf("tok", "A#1", "B#2", "siblings");
  await service.revokeNotSmurf("tok", "A#1", "B#2");

  assert.deepEqual(calls.map((c) => [c.method, c.url]), [
    ["POST", `${BASE}/links/A%231/B%232/smurf`],
    ["DELETE", `${BASE}/links/A%231/B%232/smurf`],
    ["POST", `${BASE}/links/A%231/B%232/not-smurf`],
    ["DELETE", `${BASE}/links/A%231/B%232/not-smurf`],
  ]);
  assert.deepEqual(calls[0].body, { reason: "same person" });
  assert.deepEqual(calls[2].body, { reason: "siblings" });
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[3].body, undefined);
  assert.ok(calls.every((c) => c.body === undefined || !("author" in (c.body as object))));
});

test("item overrides POST only the reason and DELETE without a body", async () => {
  const { service, calls } = serviceWith({ status: 200, body: { message: "ok", queued: 2 } });

  const trusted = await service.trustItem("tok", "Foo#123", "0a1b2c3d", "one owner");
  await service.revokeTrust("tok", "Foo#123", "0a1b2c3d");
  await service.ignoreItem("tok", "Foo#123", "0a1b2c3d", "cafe PC");
  await service.revokeIgnore("tok", "Foo#123", "0a1b2c3d");

  assert.deepEqual(calls.map((c) => [c.method, c.url]), [
    ["POST", `${BASE}/hardware/items/Foo%23123/0a1b2c3d/trust`],
    ["DELETE", `${BASE}/hardware/items/Foo%23123/0a1b2c3d/trust`],
    ["POST", `${BASE}/hardware/items/Foo%23123/0a1b2c3d/ignore`],
    ["DELETE", `${BASE}/hardware/items/Foo%23123/0a1b2c3d/ignore`],
  ]);
  assert.deepEqual(calls[0].body, { reason: "one owner" });
  assert.deepEqual(calls[2].body, { reason: "cafe PC" });
  assert.equal(calls[1].body, undefined);
  assert.equal(calls[3].body, undefined);
  assert.equal(trusted.queued, 2);
});

test("a non-2xx answer throws with the server's errors[].msg", async () => {
  const { service } = serviceWith({ status: 400, body: { errors: [{ msg: "reason is required" }] } });

  await assert.rejects(service.setSmurf("tok", "A#1", "B#2", " "), (e: unknown) => {
    assert.ok(e instanceof HardwareSmurfApiError);
    assert.equal(e.status, 400);
    assert.equal(e.serverMessage, "reason is required");
    return true;
  });
});

test("a non-2xx answer with an `error` field throws with that text", async () => {
  const { service } = serviceWith({ status: 404, body: { error: "The account has no hardware profile" } });

  await assert.rejects(service.getItems("tok", "Foo#123"), (e: unknown) => e instanceof HardwareSmurfApiError && e.status === 404 && e.serverMessage === "The account has no hardware profile");
});

test("serverMessageOf reads the known error bodies and gives null otherwise", () => {
  assert.equal(serverMessageOf(JSON.stringify({ errors: [{ msg: "a" }, { msg: "b" }] })), "a; b");
  assert.equal(serverMessageOf(JSON.stringify({ error: "nope" })), "nope");
  assert.equal(serverMessageOf(JSON.stringify({ title: "Bad", errors: { Reason: ["The Reason field is required."] } })), "The Reason field is required.");
  assert.equal(serverMessageOf(JSON.stringify({ message: "Bad gateway" })), "Bad gateway");
  assert.equal(serverMessageOf("<html>502</html>"), null);
  assert.equal(serverMessageOf(""), null);
  assert.equal(serverMessageOf(JSON.stringify({ errors: [] })), null);
});
