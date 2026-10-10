import { expect, test, vi } from "vitest";
import { strict as assert } from "node:assert";
import { keyedRequestSequence, loadLatest, requestSequence } from "./latest";

test("only the newest request of a sequence is the latest", () => {
  const sequence = requestSequence();
  const first = sequence.next();
  assert.equal(sequence.isLatest(first), true);
  const second = sequence.next();
  assert.equal(sequence.isLatest(first), false);
  assert.equal(sequence.isLatest(second), true);
});

test("invalidate supersedes every started request, and later requests are latest again", () => {
  const sequence = requestSequence();
  const started = sequence.next();
  sequence.invalidate();
  assert.equal(sequence.isLatest(started), false);
  assert.equal(sequence.isLatest(sequence.next()), true);
});

test("sequences are independent of each other", () => {
  const events = requestSequence();
  const games = requestSequence();
  const event = events.next();
  games.next();
  games.invalidate();
  assert.equal(events.isLatest(event), true);
});

test("a keyed sequence tracks the newest request per key", () => {
  const sequence = keyedRequestSequence();
  const a1 = sequence.next("a");
  const b1 = sequence.next("b");
  assert.equal(sequence.isLatest("a", a1), true);
  const a2 = sequence.next("a");
  assert.equal(sequence.isLatest("a", a1), false);
  assert.equal(sequence.isLatest("a", a2), true);
  assert.equal(sequence.isLatest("b", b1), true);
  // Numbers are never reused across keys.
  assert.equal(sequence.isLatest("b", a2), false);
});

test("invalidating a key drops only that key's requests", () => {
  const sequence = keyedRequestSequence();
  const a = sequence.next("a");
  const b = sequence.next("b");
  sequence.invalidate("a");
  assert.equal(sequence.isLatest("a", a), false);
  assert.equal(sequence.isLatest("b", b), true);
  assert.equal(sequence.isLatest("a", sequence.next("a")), true);
});

test("clearing a keyed sequence drops the requests of every key", () => {
  const sequence = keyedRequestSequence();
  const a = sequence.next("a");
  const b = sequence.next("b");
  sequence.clear();
  assert.equal(sequence.isLatest("a", a), false);
  assert.equal(sequence.isLatest("b", b), false);
  assert.equal(sequence.isLatest("a", sequence.next("a")), true);
});

test("current() is a token that stays latest until the next request or an invalidation", () => {
  const visits = requestSequence();
  const visit = visits.current();
  assert.equal(visits.isLatest(visit), true);
  visits.invalidate();
  assert.equal(visits.isLatest(visit), false);
  assert.equal(visits.isLatest(visits.current()), true);
});

test("forKey gives one key's sequence", () => {
  const sequence = keyedRequestSequence();
  const a = sequence.forKey("a");
  const first = a.next();
  sequence.next("b");
  assert.equal(a.isLatest(first), true);
  sequence.next("a");
  assert.equal(a.isLatest(first), false);
});

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason: unknown) => void } {
  let resolve: (value: T) => void = () => undefined;
  let reject: (reason: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function recorder() {
  const log: string[] = [];
  return {
    log,
    load: (what: string, fetch: () => Promise<string>) => ({
      what,
      setLoading: (loading: boolean) => log.push(`${what} loading=${loading}`),
      fetch,
      apply: (result: string) => log.push(`${what} apply ${result}`),
      fail: () => log.push(`${what} fail`),
    }),
  };
}

test("loadLatest applies only the newest result and lets only it clear loading", async () => {
  const sequence = requestSequence();
  const { log, load } = recorder();
  const old = deferred<string>();

  const first = loadLatest(sequence, load("old", () => old.promise));
  const second = loadLatest(sequence, load("new", () => Promise.resolve("B")));
  assert.equal(await second, true);
  old.resolve("A");
  assert.equal(await first, true);

  assert.deepEqual(log, ["old loading=true", "new loading=true", "new apply B", "new loading=false"]);
});

test("loadLatest logs every failure, writes it only while newest, and an invalidated load writes nothing", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const sequence = requestSequence();
  const { log, load } = recorder();

  assert.equal(await loadLatest(sequence, load("x", () => Promise.reject(new Error("down")))), false);
  const pending = deferred<string>();
  const stale = loadLatest(sequence, load("y", () => pending.promise));
  sequence.invalidate();
  pending.reject(new Error("down"));
  assert.equal(await stale, false);

  expect(consoleError).toHaveBeenCalledTimes(2);
  consoleError.mockRestore();
  assert.deepEqual(log, ["x loading=true", "x fail", "x loading=false", "y loading=true"]);
});
