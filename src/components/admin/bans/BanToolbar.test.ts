// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { DEFAULT_PAGE_QUERY } from "@/store/admin/bans/listQuery";
import { banTestPlugins, txt } from "./setup.testing";

const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});

// The lookup is stubbed at mount, but its module graph still reaches the service and window._env_.
vi.mock("@/store/admin/bans/lookup", () => ({ lookupAccounts: vi.fn(), LOOKUP_MIN_CHARS: 3 }));

import BanToolbar from "./BanToolbar.vue";

type ToolbarProps = InstanceType<typeof BanToolbar>["$props"];

const lookupStub = {
  name: "AccountLookup",
  props: ["initialText"],
  template: "<button class='pick' @click=\"$emit('pick', { accountKey: '1001', matchedBattleTag: 'tester#1001', currentBattleTag: 'Tester#1001', nameCount: 2, bansInEffect: 1, bansTotal: 1 })\" />",
};

const q = { ...DEFAULT_PAGE_QUERY, page: 3 };
let wrapper: VueWrapper;
const mounted: VueWrapper[] = [];

function mountToolbar(props: Partial<ToolbarProps> = {}): VueWrapper {
  wrapper = mount(BanToolbar, {
    props: { query: DEFAULT_PAGE_QUERY, machineOnly: false, authors: [], ...props },
    global: { plugins: banTestPlugins(), stubs: { AccountLookup: lookupStub } },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  oauth.permissions = ["Moderation"];
});

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
});

const button = (text: string) => wrapper.findAll("button").find((b) => b.text().includes(text))!;
const checkbox = (label: string) => wrapper.findAll(".v-checkbox").find((c) => c.text().includes(label))!.find("input");

/** Opens the select with this label and clicks the item in its overlay (rendered in the body). */
async function selectItem(label: string, item: string): Promise<void> {
  const field = wrapper.findAll(".v-select").find((f) => f.text().includes(label))!;
  await field.find(".v-field").trigger("mousedown");
  await flushPromises();
  const entry = Array.from(document.body.querySelectorAll<HTMLElement>(".v-list-item")).find((el) => el.textContent?.trim() === item)!;
  entry.click();
  await flushPromises();
}

test("status and moderator changes start again at page 1", async () => {
  mountToolbar({ query: q, authors: ["Helper(bot)", "Mod One"] });
  await selectItem(txt("filter_status"), txt("status_revoked"));
  expect(wrapper.emitted("update:query")?.[0]).toEqual([{ ...q, status: "revoked", page: 1 }]);
  await selectItem(txt("filter_moderator"), "Helper(bot)");
  expect(wrapper.emitted("update:query")?.[1]).toEqual([{ ...q, author: "Helper(bot)", page: 1 }]);
});

test("the machine filter exists only for AdminModeration", async () => {
  oauth.permissions = ["Moderation"];
  mountToolbar();
  expect(wrapper.text()).not.toContain(txt("filter_machine_only"));
  oauth.permissions = ["Moderation", "AdminModeration"];
  mountToolbar();
  await checkbox(txt("filter_machine_only")).setValue(true);
  expect(wrapper.emitted("update:machineOnly")).toEqual([[true]]);
});

test("picking an account opens it with the matched name", async () => {
  mountToolbar();
  await wrapper.find(".pick").trigger("click");
  expect(wrapper.emitted("openAccount")).toEqual([["1001", "tester#1001"]]);
});

test("Add ban emits add, and a lookup text is handed to the lookup", async () => {
  mountToolbar({ lookupText: "tester" });
  expect(wrapper.findComponent({ name: "AccountLookup" }).props("initialText")).toBe("tester");
  await button(txt("add_ban")).trigger("click");
  expect(wrapper.emitted("add")).toEqual([[]]);
});
