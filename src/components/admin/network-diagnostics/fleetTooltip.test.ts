// @vitest-environment jsdom
import { test } from "vitest";
import { strict as assert } from "node:assert";
import { tooltipElement } from "./fleet";

test("map tooltips render server strings as text, never as HTML", () => {
  const hostile = "Name#1234 · <img src=x onerror=alert(1)>, DE";

  const element = tooltipElement(document, hostile);

  assert.equal(element.textContent, hostile);
  assert.equal(element.querySelector("img"), null);
  assert.ok(element.innerHTML.includes("&lt;img"));
});
