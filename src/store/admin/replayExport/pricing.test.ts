import { test } from "vitest";
import { strict as assert } from "node:assert";
import { formatPrice, quoteDetail, quoteReplays } from "./pricing";

const prices = { currency: "USD", pricePerReplay: 0.02, minimumPrice: 5, free: true, available: true };

test("a replay costs $0.02, and a download costs at least $5.00", () => {
  assert.deepEqual(quoteReplays(200, prices), { replays: 200, subtotal: 4, total: 5, minimumApplies: true });
  assert.deepEqual(quoteReplays(250, prices), { replays: 250, subtotal: 5, total: 5, minimumApplies: false });
  assert.equal(quoteReplays(251, prices).total, 5.02);
  assert.equal(quoteReplays(1000, prices).total, 20);
  assert.equal(quoteReplays(10_000, prices).total, 200);
});

test("no replays cost nothing", () => {
  assert.deepEqual(quoteReplays(0, prices), { replays: 0, subtotal: 0, total: 0, minimumApplies: false });
});

test("formatPrice gives US dollars with cents", () => {
  assert.equal(formatPrice(5, "USD"), "$5.00");
  assert.equal(formatPrice(0.02, "USD"), "$0.02");
  assert.equal(formatPrice(1234.5, "USD"), "$1,234.50");
});

test("quoteDetail shows the minimum only when it applies", () => {
  assert.equal(quoteDetail(quoteReplays(200, prices), prices), "200 × $0.02 = $4.00 · $5.00 minimum");
  assert.equal(quoteDetail(quoteReplays(1000, prices), prices), "1,000 × $0.02");
  assert.equal(quoteDetail(quoteReplays(0, prices), prices), "No replays selected");
});
