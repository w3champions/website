import { test } from "vitest";
import { strict as assert } from "node:assert";
import { buildMapsQuery, toMapWriteContract } from "./mapsRequest";
import type { Map } from "@/store/admin/mapsManagement/types";

test("no query at all when nothing is asked for", () => {
  assert.equal(buildMapsQuery(), "");
  assert.equal(buildMapsQuery(undefined, false), "");
});

test("temporary maps are opted into by name, exactly as the matchmaking service expects", () => {
  assert.equal(buildMapsQuery(undefined, true), "includeTemporary=true");
});

test("the filter is carried and url-encoded", () => {
  // The old hand-rolled string produced "?&filter=Team OZE" - a stray
  // ampersand and a raw space.
  assert.equal(buildMapsQuery("Team OZE"), "filter=Team+OZE");
  assert.equal(buildMapsQuery("Team OZE", true), "filter=Team+OZE&includeTemporary=true");
});

test("an empty filter is not sent", () => {
  assert.equal(buildMapsQuery("", true), "includeTemporary=true");
});

test("the write contract carries every field the admin can actually edit", () => {
  const map: Map = {
    id: 42,
    name: "Twisted Meadows",
    category: "Melee",
    maxTeams: 2,
    mappedForces: [],
    disabled: false,
    uploader: "Player#1234",
  };

  assert.deepEqual(toMapWriteContract(map), {
    id: 42,
    name: "Twisted Meadows",
    category: "Melee",
    maxTeams: 2,
    mappedForces: [],
    gameMap: undefined,
    disabled: false,
  });
});

test("server-owned temporary-map fields are never written back", () => {
  // GET api/maps now returns these; PUT api/maps/:id must not echo them back,
  // and the matchmaking service rejects PUT for a temporary map outright.
  // `uploader` is server-owned too (website-backend stamps it), and `path` is
  // an untyped raw-row key that a deep clone of a table row can still carry.
  const map = {
    id: 5811,
    name: "Legion TD",
    maxTeams: 2,
    disabled: false,
    temporary: true,
    fileState: "present",
    lastHostedAt: 1_757_840_000_000,
    uploader: "Player#1234",
    path: "W3Champions/CustomGames/x-94ec3bda.w3x",
  } as Map;

  const written: object = toMapWriteContract(map);

  assert.equal("temporary" in written, false);
  assert.equal("fileState" in written, false);
  assert.equal("lastHostedAt" in written, false);
  assert.equal("uploader" in written, false);
  assert.equal("path" in written, false);
});
