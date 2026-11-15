import assert from "node:assert/strict";
import { test } from "vitest";
import { authorName, looksLikeBattleTag, sameTag } from "./tags";

test("authors lose #number only when they look like a BattleTag", () => {
  assert.equal(authorName("ModOne#3001"), "ModOne");
  assert.equal(authorName("Тестер#1002"), "Тестер");
  for (const free of ["Helper(bot)", "Mod One", "A#B#1", "Mod #1", "Mod#", "#123", "migration"]) assert.equal(authorName(free), free);
  assert.equal(looksLikeBattleTag("ModOne#3001"), true);
  assert.equal(looksLikeBattleTag("Mod One"), false);
});
test("tags compare ignoring case, Unicode-aware", () => {
  assert.equal(sameTag("Тестер#1002", "тестер#1002"), true);
  assert.equal(sameTag("Tester#1001", "Тестер#1002"), false);
});
