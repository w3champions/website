import { test } from "vitest";
import { strict as assert } from "node:assert";
import type { SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { unreviewedNeighbours } from "./neighbours";

function row(id: string, from: string, review: SmurfEventReview) {
  return { id, from, review };
}

const D1 = "2026-10-01T06:00:00.000Z";
const D2 = "2026-10-02T06:00:00.000Z";
const D3 = "2026-10-03T06:00:00.000Z";
const D4 = "2026-10-04T06:00:00.000Z";

test("without events there are no neighbours", () => {
  assert.deepEqual(unreviewedNeighbours([], { id: "b", from: D2 }), { previous: null, next: null });
});

test("right after a review the reviewed event sits among the unreviewed ones by its own place", () => {
  // The server's order: from descending. The open event (c, confirmed) is now in the middle of the list.
  const events = [row("d", D4, "unreviewed"), row("c", D3, "confirmed"), row("b", D2, "unreviewed"), row("a", D1, "unreviewed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "c", from: D3 }), { previous: "d", next: "b" });
});

test("under the unreviewed filter the open event is not in the list and the neighbours still follow its place", () => {
  const events = [row("d", D4, "unreviewed"), row("b", D2, "unreviewed"), row("a", D1, "unreviewed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "c", from: D3 }), { previous: "d", next: "b" });
});

test("an open event outside the loaded list gets the nearest loaded neighbours on either side", () => {
  const events = [row("b", D2, "unreviewed"), row("a", D1, "unreviewed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "z", from: D4 }), { previous: null, next: "b" });
  assert.deepEqual(unreviewedNeighbours(events, { id: "z", from: "2026-09-01T00:00:00.000Z" }), { previous: "a", next: null });
});

test("events that start at the same time are ordered by id descending", () => {
  const events = [row("c", D2, "unreviewed"), row("b", D2, "unreviewed"), row("a", D2, "unreviewed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "b", from: D2 }), { previous: "c", next: "a" });
});

test("an unreviewed open event is never its own neighbour", () => {
  const events = [row("c", D3, "unreviewed"), row("b", D2, "unreviewed"), row("a", D1, "unreviewed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "c", from: D3 }), { previous: null, next: "b" });
});

test("the order of the list as passed does not matter", () => {
  const events = [row("a", D1, "unreviewed"), row("c", D3, "unreviewed"), row("b", D2, "confirmed")];

  assert.deepEqual(unreviewedNeighbours(events, { id: "b", from: D2 }), { previous: "c", next: "a" });
});
