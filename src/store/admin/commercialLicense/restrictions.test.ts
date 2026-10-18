import { test } from "vitest";
import { strict as assert } from "node:assert";
import type { FloTvRestriction } from "./types";
import { FLO_TV_OPTIONS, normalizeTag, restrictionSummary } from "./restrictions";

const base = {
  battleTag: "Foo#1",
  note: "n",
  notify: true,
  createdBy: "Mod#1",
  createdAt: "2026-10-08T10:00:00Z",
  updatedBy: "Mod#1",
  updatedAt: "2026-10-08T10:00:00Z",
};

test("normalizeTag fills restrictions when the backend sent null", () => {
  assert.deepEqual(normalizeTag({ ...base, restrictions: null }).restrictions, { asPlayer: false, asObserver: false, floTv: "none", includeSmurfs: false });
});

test("normalizeTag fills restrictions when the field is missing", () => {
  assert.deepEqual(normalizeTag(base).restrictions, { asPlayer: false, asObserver: false, floTv: "none", includeSmurfs: false });
});

test("normalizeTag keeps present restrictions and the other fields", () => {
  const restrictions = { asPlayer: true, asObserver: false, floTv: "all" as const, includeSmurfs: true };
  assert.deepEqual(normalizeTag({ ...base, restrictions, commercialEventNotice: true }), { ...base, restrictions, commercialEventNotice: true });
});

test("normalizeTag reads a null or missing commercialEventNotice as false", () => {
  assert.equal(normalizeTag({ ...base, commercialEventNotice: null }).commercialEventNotice, false);
  assert.equal(normalizeTag(base).commercialEventNotice, false);
});

test("no restrictions yields an empty summary", () => {
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "none", includeSmurfs: false }), []);
});

test("each restriction yields its own label, in a stable order", () => {
  assert.deepEqual(restrictionSummary({ asPlayer: true, asObserver: false, floTv: "none", includeSmurfs: false }), ["Player"]);
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: true, floTv: "none", includeSmurfs: false }), ["Observer"]);
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "custom", includeSmurfs: false }), ["FloTV: custom games"]);
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "all", includeSmurfs: false }), ["FloTV: all games"]);
  assert.deepEqual(restrictionSummary({ asPlayer: true, asObserver: true, floTv: "all", includeSmurfs: false }), ["Player", "Observer", "FloTV: all games"]);
});

test("the FloTV select offers none, custom and all, in that order", () => {
  assert.deepEqual(FLO_TV_OPTIONS, [
    { title: "None", value: "none" },
    { title: "Custom games", value: "custom" },
    { title: "All games", value: "all" },
  ]);
});

test("restrictionSummary surfaces an unknown future FloTV value instead of hiding it", () => {
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "future" as FloTvRestriction, includeSmurfs: false }), ["FloTV: future"]);
});

test("restrictionSummary shows no FloTV chip for none", () => {
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "none", includeSmurfs: false }), []);
});

test("normalizeTag reads a null or missing restrictions.includeSmurfs as false", () => {
  assert.equal(normalizeTag({ ...base, restrictions: { asPlayer: true, asObserver: false, floTv: "all" } }).restrictions.includeSmurfs, false);
  assert.equal(normalizeTag({ ...base, restrictions: { asPlayer: true, asObserver: false, floTv: "all", includeSmurfs: null } }).restrictions.includeSmurfs, false);
});

test("restrictionSummary appends 'Incl. smurfs' only next to an active restriction", () => {
  assert.deepEqual(restrictionSummary({ asPlayer: true, asObserver: false, floTv: "none", includeSmurfs: true }), ["Player", "Incl. smurfs"]);
  assert.deepEqual(restrictionSummary({ asPlayer: false, asObserver: false, floTv: "none", includeSmurfs: true }), []);
});
