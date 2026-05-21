import { test } from "node:test";
import { strict as assert } from "node:assert";
import { PlayerMatchTelemetryService } from "./PlayerMatchTelemetryService";

function stubFetch(responseInit: { status: number; body?: unknown }) {
  return async (_url: string, _init?: RequestInit): Promise<Response> => {
    if (responseInit.body !== undefined) {
      return new Response(JSON.stringify(responseInit.body), {
        status: responseInit.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(null, { status: responseInit.status });
  };
}

test("getByGame returns parsed telemetry on 200", async () => {
  const fake = {
    gameId: 42,
    matchWallStart: "2026-05-21T12:00:00Z",
    bucketMs: 1000,
    players: [],
    createdAt: "2026-05-21T12:30:00Z",
    expiresAt: "2026-08-19T12:30:00Z",
  };
  const svc = new PlayerMatchTelemetryService({
    endpoint: "https://example.test/",
    fetch: stubFetch({ status: 200, body: fake }) as unknown as typeof globalThis.fetch,
  });
  const result = await svc.getByGame("token123", 42);
  assert.deepEqual(result, fake);
});

test("getByGame returns null on 404", async () => {
  const svc = new PlayerMatchTelemetryService({
    endpoint: "https://example.test/",
    fetch: stubFetch({ status: 404 }) as unknown as typeof globalThis.fetch,
  });
  const result = await svc.getByGame("token123", 42);
  assert.equal(result, null);
});

test("getByGame throws on 500", async () => {
  const svc = new PlayerMatchTelemetryService({
    endpoint: "https://example.test/",
    fetch: stubFetch({ status: 500 }) as unknown as typeof globalThis.fetch,
  });
  await assert.rejects(
    () => svc.getByGame("token123", 42),
    /500/,
  );
});
