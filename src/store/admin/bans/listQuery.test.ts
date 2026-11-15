import assert from "node:assert/strict";
import { test } from "vitest";
import { DEFAULT_PAGE_QUERY, entryPlayerFromRoute, listRequestOf, pageQueryFromRoute, pageQueryToRoute, withAccount } from "./listQuery";

test("status, author, sort, dir, page and account come from the URL; unknown values are ignored", () => {
  assert.deepEqual(pageQueryFromRoute({ status: "revoked", author: "Helper(bot)", sort: "ends", dir: "asc", page: "3", account: "tag:Tester#1001" }), {
    status: "revoked",
    author: "Helper(bot)",
    sort: "ends",
    dir: "asc",
    page: 3,
    account: "tag:Tester#1001",
  });
  assert.deepEqual(pageQueryFromRoute({ status: "bogus", sort: "accountDefault", dir: "up", page: "0", author: ["a", "b"] }), DEFAULT_PAGE_QUERY);
});
test("an author is kept up to 200 characters; a page must be a whole number", () => {
  assert.equal(pageQueryFromRoute({ author: "a".repeat(200) }).author, "a".repeat(200));
  assert.equal(pageQueryFromRoute({ author: "a".repeat(201) }).author, null);
  assert.equal(pageQueryFromRoute({ page: "2.5" }).page, 1);
  assert.equal(pageQueryFromRoute({ page: "abc" }).page, 1);
});
test("an author is trimmed", () => {
  assert.equal(pageQueryFromRoute({ author: " Mod One " }).author, "Mod One");
});
test("defaults stay out of the URL, the machine filter never enters it, and an entry player is dropped", () => {
  assert.deepEqual(pageQueryToRoute(DEFAULT_PAGE_QUERY), { status: undefined, author: undefined, sort: undefined, dir: undefined, page: undefined, account: undefined, player: undefined });
  assert.ok(!Object.keys(pageQueryToRoute({ ...DEFAULT_PAGE_QUERY, page: 2 })).includes("machineOnly"));
});
test("set values are written as strings", () => {
  const written = pageQueryToRoute({ status: "expired", author: "Mod One", sort: "ends", dir: "asc", page: 2, account: "1001" });
  assert.deepEqual(written, { status: "expired", author: "Mod One", sort: "ends", dir: "asc", page: "2", account: "1001", player: undefined });
});
test("the entry player is read from the URL, trimmed, and only as a single value", () => {
  assert.equal(entryPlayerFromRoute({ player: " Тестер#1002 " }), "Тестер#1002");
  assert.equal(entryPlayerFromRoute({ player: ["Tester#1001", "Тестер#1002"] }), null);
  assert.equal(entryPlayerFromRoute({ player: "  " }), null);
  assert.equal(entryPlayerFromRoute({}), null);
  assert.deepEqual(pageQueryFromRoute({ player: "Tester#1001" }), DEFAULT_PAGE_QUERY);
});
test("the list request uses the account default order only in the account view", () => {
  assert.deepEqual(listRequestOf(DEFAULT_PAGE_QUERY, false), { sort: "lastChange", dir: "desc", page: 1, pageSize: 25 });
  assert.equal(listRequestOf({ ...DEFAULT_PAGE_QUERY, account: "1001" }, false).sort, "accountDefault");
  assert.equal(listRequestOf(DEFAULT_PAGE_QUERY, true).machineOnly, true);
  assert.equal("machineOnly" in listRequestOf(DEFAULT_PAGE_QUERY, false), false);
});
test("the machine filter stays out of an account's request", () => {
  assert.equal("machineOnly" in listRequestOf({ ...DEFAULT_PAGE_QUERY, account: "1001" }, true), false);
});
test("opening an account starts it on page 1 without the log's filters", () => {
  assert.deepEqual(withAccount({ ...DEFAULT_PAGE_QUERY, status: "expired", author: "Mod One", page: 4 }, "1001"), { ...DEFAULT_PAGE_QUERY, account: "1001" });
  assert.deepEqual(withAccount({ ...DEFAULT_PAGE_QUERY, account: "1001" }, null), DEFAULT_PAGE_QUERY);
});
