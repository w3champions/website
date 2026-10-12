// @vitest-environment jsdom
import { test } from "vitest";
import { strict as assert } from "node:assert";
import { MAX_TOOLTIP_MEMBERS, tooltipElement } from "./fleet";

test("map tooltips render server strings as text, never as HTML", () => {
  const hostile = "Name#1234 · <img src=x onerror=alert(1)>, DE";

  const element = tooltipElement(document, [hostile]);

  assert.equal(element.textContent, hostile);
  assert.equal(element.querySelector("img"), null);
  assert.ok(element.innerHTML.includes("&lt;img"));
});

test("a dot shared by several measurements lists each on its own line", () => {
  const element = tooltipElement(document, ["A#1 · US", "<img src=x onerror=alert(1)>#2 · US"]);

  assert.deepEqual([...element.children].map((line) => line.textContent), ["A#1 · US", "<img src=x onerror=alert(1)>#2 · US"]);
  assert.equal(element.querySelector("img"), null);
});

test("a crowded dot lists the first five measurements and counts the rest", () => {
  const labels = Array.from({ length: 8 }, (_, index) => `Player#${index}`);

  const lines = [...tooltipElement(document, labels).children].map((line) => line.textContent);

  assert.equal(MAX_TOOLTIP_MEMBERS, 5);
  assert.deepEqual(lines, ["Player#0", "Player#1", "Player#2", "Player#3", "Player#4", "and 3 more"]);
  assert.deepEqual([...tooltipElement(document, labels.slice(0, 5)).children].map((line) => line.textContent), labels.slice(0, 5));
});
