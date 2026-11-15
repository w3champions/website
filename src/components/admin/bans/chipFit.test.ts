import assert from "node:assert/strict";
import { test } from "vitest";
import { fitChipCount } from "./chipFit";

test("every chip shows when all fit", () => assert.equal(fitChipCount([60, 60], 30, 124), 2));

test("+N keeps its full width: chips are dropped until it fits", () => {
  assert.equal(fitChipCount([80, 80, 80], 30, 200), 2); // 80+4+80 +4+30 = 198
  assert.equal(fitChipCount([80, 80, 80], 30, 150), 1);
});

test("a first chip wider than the cell still shows, and shrinks", () => assert.equal(fitChipCount([150, 60, 60], 30, 170), 1));

test("no modes, no chips", () => assert.equal(fitChipCount([], 30, 100), 0));
