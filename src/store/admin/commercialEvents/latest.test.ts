import { test } from "vitest";
import { strict as assert } from "node:assert";
import { keyedRequestSequence, requestSequence } from "./latest";

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
