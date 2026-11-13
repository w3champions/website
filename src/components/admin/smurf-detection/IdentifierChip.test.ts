// @vitest-environment jsdom
import { afterEach, expect, test } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { testPlugins } from "../smurf-events/setup.testing";
import IdentifierChip from "./IdentifierChip.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

function show(props: { kind: string; hash8: string; values?: string[]; keys?: number }): void {
  wrapper = mount(IdentifierChip, { props, global: { plugins: testPlugins() } });
}

test("shows the kind and the hash", () => {
  show({ kind: "V:disk", hash8: "9f8e7d6c" });

  expect(wrapper.text()).toContain("V:disk");
  expect(wrapper.text()).toContain("9f8e7d6c");
});

test("shows the number of keys only when there is more than one", () => {
  show({ kind: "V:disk", hash8: "9f8e7d6c", keys: 1 });
  expect(wrapper.text()).not.toContain("keys");
  wrapper.unmount();

  show({ kind: "V:disk", hash8: "9f8e7d6c", keys: 3 });
  expect(wrapper.text()).toContain("(3 keys)");
});

test("renders values as plain text, never as markup", () => {
  show({ kind: "L:ds", hash8: "9f8e7d6c", values: ["<img src=x onerror=1>"] });

  expect(wrapper.text()).toContain("<img src=x onerror=1>");
  expect(wrapper.find("img").exists()).toBe(false);
});

test("shows no value text without values", () => {
  show({ kind: "L:ds", hash8: "9f8e7d6c" });

  expect(wrapper.find(".chip-values").exists()).toBe(false);
});
