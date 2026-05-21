import { test } from "node:test";
import { strict as assert } from "node:assert";
import { PlayerMatchTelemetryService } from "./PlayerMatchTelemetryService";

function stubFetch(responseInit: { status: number; body?: unknown }) {
  return (_url: string, _init?: RequestInit): Promise<Response> => {
    if (responseInit.body !== undefined) {
      return Promise.resolve(
        new Response(JSON.stringify(responseInit.body), {
          status: responseInit.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(new Response(null, { status: responseInit.status }));
  };
}

test("getByGame parses wire ISO timestamps into Date objects", async () => {
  const fake = {
    gameId: 42,
    matchWallStart: "2026-05-21T12:00:00Z",
    players: [
      {
        battleTag: "Alice#1234",
        connectionType: "QUIC",
        gameLengthMs: 600000,
        crashedAt: "2026-05-21T12:09:30Z",
        disconnectEvents: [
          { startedAt: "2026-05-21T12:03:15Z", durationMs: 5000 },
          { startedAt: "2026-05-21T12:07:42Z", durationMs: 12000 },
        ],
        actionLatencyAggregate: {
          sampleCount: 100,
          p10Ms: 20,
          p50Ms: 40,
          p99Ms: 200,
          p999Ms: 400,
          meanMs: 60,
          stddevMs: 30,
        },
        bucketCount: 3,
        gameTimeOffsetsMs: [0, 1000, 2000],
        meansMs: [30, 42, 38],
        sampleCounts: [5, 7, 6],
        droppedUnmatchedCount: 0,
        submittedAt: "2026-05-21T12:30:00Z",
      },
      {
        battleTag: "Bob#5678",
        connectionType: "TCP",
        gameLengthMs: 600000,
        crashedAt: null,
        disconnectEvents: [],
        actionLatencyAggregate: {
          sampleCount: 80,
          p10Ms: 25,
          p50Ms: 50,
          p99Ms: 220,
          p999Ms: 420,
          meanMs: 70,
          stddevMs: 35,
        },
        bucketCount: 0,
        gameTimeOffsetsMs: [],
        meansMs: [],
        sampleCounts: [],
        droppedUnmatchedCount: 1,
        submittedAt: "2026-05-21T12:30:01Z",
      },
    ],
    createdAt: "2026-05-21T12:30:00Z",
    expiresAt: "2026-08-19T12:30:00Z",
  };
  const svc = new PlayerMatchTelemetryService({
    endpoint: "https://example.test/",
    fetch: stubFetch({ status: 200, body: fake }) as unknown as typeof globalThis.fetch,
  });
  const result = await svc.getByGame("token123", 42);

  assert.notEqual(result, null);
  if (result === null) return;

  assert.equal(result.gameId, 42);
  assert.equal(result.matchWallStart instanceof Date, true);
  assert.equal(result.matchWallStart.toISOString(), "2026-05-21T12:00:00.000Z");
  assert.equal(result.createdAt instanceof Date, true);
  assert.equal(result.expiresAt instanceof Date, true);

  assert.equal(result.players.length, 2);

  const alice = result.players[0];
  assert.equal(alice.battleTag, "Alice#1234");
  assert.equal(alice.connectionType, "QUIC");
  assert.equal(alice.crashedAt instanceof Date, true);
  assert.equal((alice.crashedAt as Date).toISOString(), "2026-05-21T12:09:30.000Z");
  assert.equal(alice.submittedAt instanceof Date, true);
  assert.equal(alice.disconnectEvents.length, 2);
  assert.equal(alice.disconnectEvents[0].startedAt instanceof Date, true);
  assert.equal(alice.disconnectEvents[0].durationMs, 5000);
  // Plain typed arrays should round-trip unchanged.
  assert.deepEqual(alice.gameTimeOffsetsMs, [0, 1000, 2000]);
  assert.deepEqual(alice.meansMs, [30, 42, 38]);
  assert.deepEqual(alice.sampleCounts, [5, 7, 6]);

  const bob = result.players[1];
  assert.equal(bob.crashedAt, null);
  assert.equal(bob.disconnectEvents.length, 0);
  assert.equal(bob.bucketCount, 0);
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
