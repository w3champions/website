// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { AccountLookupResponse, AccountSuggestion } from "@/store/admin/bans/types";
import { banTestPlugins, txt } from "./setup.testing";

const lookupAccounts = vi.hoisted(() => vi.fn());
vi.mock("@/store/admin/bans/lookup", () => ({ lookupAccounts, LOOKUP_MIN_CHARS: 3 }));

import AccountLookup from "./AccountLookup.vue";

const s = (tag: string, accountKey: string, extra: Partial<AccountSuggestion> = {}): AccountSuggestion => ({
  accountKey,
  matchedBattleTag: tag,
  currentBattleTag: tag,
  nameCount: 1,
  bansInEffect: 0,
  bansTotal: 0,
  ...extra,
});
const one = s("Tester#1001", "1001");
const two = s("Тестер#1002", "1002");

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

let wrapper: VueWrapper;
const mounted: VueWrapper[] = [];

function mountLookup(props: Record<string, unknown> = {}): VueWrapper {
  const plugins = banTestPlugins();
  wrapper = mount(AccountLookup, {
    props: { label: txt("lookup_label"), ...props },
    global: { plugins },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

const input = () => wrapper.find("input");
const key = (k: string, extra: object = {}) => input().trigger("keydown", { key: k, ...extra });
async function typeAndWait(text: string): Promise<void> {
  await input().setValue(text);
  await vi.advanceTimersByTimeAsync(500);
  await flushPromises();
}

beforeEach(() => {
  vi.useFakeTimers();
  lookupAccounts.mockReset();
  mountLookup();
});

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  vi.useRealTimers();
});

test("fewer than 3 letters send nothing", async () => {
  await typeAndWait("te");
  expect(lookupAccounts).not.toHaveBeenCalled();
  expect(wrapper.text()).toContain(txt("lookup_min_chars"));
});

test("a suggestion shows matched name → current name, names and bans, and the list says when more exist", async () => {
  lookupAccounts.mockResolvedValue({ total: 12, results: [s("Tester#1001", "1001", { currentBattleTag: "Тестер#1002", nameCount: 3, bansInEffect: 2, bansTotal: 3 })] });
  await typeAndWait("tester");
  expect(lookupAccounts).toHaveBeenCalledWith("tester");
  expect(wrapper.text()).toContain(txt("lookup_now", { tag: "Тестер#1002" }));
  expect(wrapper.text()).toContain(txt("lookup_names_other", { count: 3 }));
  expect(wrapper.text()).toContain(txt("lookup_bans", { inEffect: 2, total: 3 }));
  expect(wrapper.text()).toContain(txt("lookup_more", { shown: 1, total: 12 }));
});

test("Enter with several results and none highlighted picks nothing and keeps the list open", async () => {
  lookupAccounts.mockResolvedValue({ total: 2, results: [one, two] });
  await typeAndWait("ster");
  await key("Enter");
  expect(wrapper.emitted("pick")).toBeUndefined();
  expect(input().attributes("aria-expanded")).toBe("true");
});

test("arrow keys highlight and Enter picks the highlighted one", async () => {
  lookupAccounts.mockResolvedValue({ total: 2, results: [one, two] });
  await typeAndWait("ster");
  await key("ArrowDown");
  await key("ArrowDown");
  await key("ArrowUp");
  const active = input().attributes("aria-activedescendant");
  expect(wrapper.find(`#${active}`).attributes("aria-selected")).toBe("true");
  expect(wrapper.find(`#${active}`).text()).toContain("Tester#1001");
  await key("Enter");
  expect(wrapper.emitted("pick")).toEqual([[one]]);
});

test("Enter picks the only result and clears the text", async () => {
  lookupAccounts.mockResolvedValue({ total: 1, results: [one] });
  await typeAndWait("tester");
  await key("Enter");
  expect(wrapper.emitted("pick")).toEqual([[one]]);
  expect((input().element as HTMLInputElement).value).toBe("");
});

test("Enter while the answer for the current text is pending picks nothing", async () => {
  lookupAccounts.mockResolvedValueOnce({ total: 1, results: [one] });
  await typeAndWait("tester");
  await input().setValue("tester#"); // debounce not fired yet
  await key("Enter");
  expect(wrapper.emitted("pick")).toBeUndefined();
});

test("an older answer never replaces a newer one", async () => {
  const first = deferred<AccountLookupResponse>();
  const second = deferred<AccountLookupResponse>();
  lookupAccounts.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  await typeAndWait("tester");
  await typeAndWait("тестер");
  second.resolve({ total: 1, results: [two] });
  await flushPromises();
  first.resolve({ total: 1, results: [one] });
  await flushPromises();
  expect(wrapper.findAll("[role='option']").map((o) => o.text().includes("Тестер#1002"))).toEqual([true]);
});

test("Escape closes the list; a click picks", async () => {
  lookupAccounts.mockResolvedValue({ total: 2, results: [one, two] });
  await typeAndWait("ster");
  await key("Escape");
  expect(input().attributes("aria-expanded")).toBe("false");
  await key("ArrowDown");
  await wrapper.findAll("[role='option']")[1].trigger("click");
  expect(wrapper.emitted("pick")).toEqual([[two]]);
});

test("Escape on an open list does not reach window, on a closed list it does", async () => {
  lookupAccounts.mockResolvedValue({ total: 1, results: [one] });
  const onWindowKey = vi.fn();
  window.addEventListener("keydown", onWindowKey);
  try {
    await typeAndWait("tester");
    await key("Escape");
    expect(input().attributes("aria-expanded")).toBe("false");
    expect(onWindowKey).not.toHaveBeenCalled();
    await key("Escape");
    expect(onWindowKey).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener("keydown", onWindowKey);
  }
});

test("a click on a stale row picks nothing", async () => {
  lookupAccounts.mockResolvedValue({ total: 1, results: [one] });
  await typeAndWait("tester");
  await input().setValue("tester#"); // answer pending
  await wrapper.findAll("[role='option']")[0].trigger("click");
  expect(wrapper.emitted("pick")).toBeUndefined();
});

test("aria-controls names an element that exists while the list is open", async () => {
  lookupAccounts.mockResolvedValue({ total: 0, results: [] });
  await typeAndWait("nobody");
  expect(wrapper.find(`#${input().attributes("aria-controls")}`).exists()).toBe(true);
});

test("new results start with nothing highlighted", async () => {
  lookupAccounts.mockResolvedValue({ total: 2, results: [one, two] });
  await typeAndWait("ster");
  await key("ArrowDown");
  await input().setValue("ster2");
  await vi.advanceTimersByTimeAsync(500);
  await flushPromises();
  expect(input().attributes("aria-activedescendant")).toBeUndefined();
});

test("Enter that confirms an IME composition does nothing", async () => {
  lookupAccounts.mockResolvedValue({ total: 1, results: [one] });
  await typeAndWait("tester");
  await key("Enter", { isComposing: true });
  expect(wrapper.emitted("pick")).toBeUndefined();
});

test("a starting text is searched at once and the list opens", async () => {
  lookupAccounts.mockResolvedValue({ total: 2, results: [one, two] });
  mountLookup({ initialText: "tester" });
  await flushPromises(); // no debounce wait
  expect(lookupAccounts).toHaveBeenCalledWith("tester");
  expect((input().element as HTMLInputElement).value).toBe("tester");
  expect(input().attributes("aria-expanded")).toBe("true");
  expect(wrapper.emitted("pick")).toBeUndefined();
});
