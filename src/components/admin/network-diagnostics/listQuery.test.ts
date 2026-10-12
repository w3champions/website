import { test } from "vitest";
import { strict as assert } from "node:assert";
import { buildListQuery, nextTablePage, positiveInt, queryText, readListQuery, sameListQuery } from "./listQuery";

test("queryText reads a string value and treats anything else as empty", () => {
  assert.equal(queryText({ a: "x" }, "a"), "x");
  assert.equal(queryText({ a: ["x", "y"] }, "a"), "");
  assert.equal(queryText({ a: null }, "a"), "");
  assert.equal(queryText({}, "a"), "");
});

test("positiveInt accepts positive integers only", () => {
  assert.equal(positiveInt("3", 1), 3);
  assert.equal(positiveInt("0", 1), 1);
  assert.equal(positiveInt("-2", 1), 1);
  assert.equal(positiveInt("1.5", 1), 1);
  assert.equal(positiveInt("abc", 7), 7);
  assert.equal(positiveInt("", 7), 7);
});

test("readListQuery reads the named filters, the page and the page size", () => {
  const read = readListQuery({ createdBy: "A#1", page: "3", itemsPerPage: "50", other: "z" }, ["createdBy", "from"], 25);
  assert.deepEqual(read, { filters: { createdBy: "A#1", from: "" }, page: 3, itemsPerPage: 50 });
});

test("readListQuery falls back to page 1 and the default page size", () => {
  const read = readListQuery({ page: "0", itemsPerPage: "x" }, ["from"], 25);
  assert.deepEqual(read, { filters: { from: "" }, page: 1, itemsPerPage: 25 });
});

test("buildListQuery leaves out empty filters and default paging", () => {
  assert.deepEqual(buildListQuery({ createdBy: "A#1", from: "", to: null }, 1, 25, 25), { createdBy: "A#1" });
});

test("buildListQuery keeps a non-default page and page size", () => {
  assert.deepEqual(buildListQuery({ from: "2026-10-01" }, 2, 50, 25), { from: "2026-10-01", page: "2", itemsPerPage: "50" });
});

test("nextTablePage returns null when nothing changed", () => {
  assert.equal(nextTablePage({ page: 2, itemsPerPage: 50 }, { page: 2, itemsPerPage: 50 }, 25), null);
});

test("nextTablePage returns the new paging when it changed", () => {
  assert.deepEqual(nextTablePage({ page: 3, itemsPerPage: 50 }, { page: 2, itemsPerPage: 50 }, 25), { page: 3, itemsPerPage: 50 });
});

test("nextTablePage repairs non-positive options", () => {
  assert.deepEqual(nextTablePage({ page: 0, itemsPerPage: -1 }, { page: 2, itemsPerPage: 50 }, 25), { page: 1, itemsPerPage: 25 });
});

test("sameListQuery compares every filter and the paging", () => {
  const base = { filters: { battleTag: "A#1", runId: "" }, page: 2, itemsPerPage: 25 };
  assert.equal(sameListQuery(base, { filters: { battleTag: "A#1", runId: "" }, page: 2, itemsPerPage: 25 }), true);
  assert.equal(sameListQuery(base, { ...base, filters: { battleTag: "a#1", runId: "" } }), false, "BattleTags are compared exactly");
  assert.equal(sameListQuery(base, { ...base, filters: { battleTag: "A#1", runId: "r" } }), false);
  assert.equal(sameListQuery(base, { ...base, page: 3 }), false);
  assert.equal(sameListQuery(base, { ...base, itemsPerPage: 50 }), false);
});
