import { test } from "vitest";
import { strict as assert } from "node:assert";
import { buildMapsQuery, errorFromBody, isTemporaryMap, parseErrorBody, toMapWriteContract } from "./mapsRequest";
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

test("only an explicit temporary: true makes a map temporary", () => {
  // A temporary map is read-only on the admin page, so anything short of an
  // explicit true - absent on a permanent row before website-backend ships,
  // false once it does, or a truthy non-boolean - must read as permanent.
  const permanent: Map = { id: 7, name: "Echo Isles", maxTeams: 2, disabled: false };

  assert.equal(isTemporaryMap({ ...permanent, temporary: true }), true);
  assert.equal(isTemporaryMap({ ...permanent, temporary: false }), false);
  assert.equal(isTemporaryMap({ ...permanent, temporary: undefined }), false);
  assert.equal(isTemporaryMap(permanent), false);
  assert.equal(isTemporaryMap({ ...permanent, temporary: "true" as unknown as boolean }), false);
});

test("a duplicate upload shows the update service's own words", () => {
  // update-service answers 409 {"message":"File already exists"}; the backend
  // unwraps that and re-emits the message as a bare text/plain body, which
  // parseErrorBody hands over as a raw string because JSON.parse rejects it.
  const error = errorFromBody("File already exists", 409);

  assert.equal(error.message, "File already exists");
});

test("the matchmaking validation envelope is joined into one sentence", () => {
  const error = errorFromBody({ errors: [{ msg: "name is required" }, { msg: "maxTeams must be >= 1" }] }, 400);

  assert.equal(error.message, "name is required, maxTeams must be >= 1");
});

test("website-backend's { error } and update-service's { message } bodies are read too", () => {
  // { error } is website-backend's ErrorResult (its global exception filter);
  // { message } is update-service's own error body.
  assert.equal(errorFromBody({ error: "Matchmaking service unavailable" }, 502).message, "Matchmaking service unavailable");
  assert.equal(errorFromBody({ message: "File already exists" }, 409).message, "File already exists");
  // Blank text says nothing, so the status is named instead.
  assert.equal(errorFromBody({ error: "  " }, 502).message, "Request failed with status 502.");
  assert.equal(errorFromBody({ message: "" }, 409).message, "Request failed with status 409.");
});

test("an error body is parsed when it is JSON and kept as text when it is not", () => {
  const envelope = { errors: [{ msg: "name is required" }] };
  assert.deepEqual(parseErrorBody(JSON.stringify(envelope)), envelope);
  assert.equal(parseErrorBody("File already exists"), "File already exists");
  assert.equal(parseErrorBody(""), undefined);
  assert.equal(parseErrorBody(" \n "), undefined);
  // End to end: a text/plain body from a fetch call reaches the admin as written.
  assert.equal(errorFromBody(parseErrorBody("File already exists"), 409).message, "File already exists");
});

test("a body nobody recognises still names the status", () => {
  assert.equal(errorFromBody({ unexpected: true }, 502).message, "Request failed with status 502.");
  assert.equal(errorFromBody("   ", 500).message, "Request failed with status 500.");
  assert.equal(errorFromBody(undefined, 413).message, "Request failed with status 413.");
});
