// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { accountView, banSummary, FIXTURE_NOW } from "@/store/admin/bans/fixtures.testing";
import { DEFAULT_PAGE_QUERY } from "@/store/admin/bans/listQuery";
import type { AccountName, AccountView } from "@/store/admin/bans/types";
import { banTestPlugins, normalizedHtml, txt } from "./setup.testing";

const service = vi.hoisted(() => ({
  list: vi.fn(),
  account: vi.fn(),
  lookup: vi.fn(),
  create: vi.fn(),
  edit: vi.fn(),
  revoke: vi.fn(),
  authors: vi.fn(),
  machineIds: vi.fn(),
  machineIdAccounts: vi.fn(),
  machineImpact: vi.fn(),
}));
vi.mock("@/services/admin/BanAdminService", () => ({ BanAdminService: service }));
const oauth = vi.hoisted(() => ({ token: "tok", permissions: [] as string[] }));
vi.mock("@/store/oauth/store", async () => {
  const { reactive } = await import("vue");
  const state = reactive(oauth);
  return { useOauthStore: () => state };
});

// The table is stubbed at mount, but its module graph still reaches the admin store and window._env_.
vi.mock("@/store/admin/store", () => ({ useAdminStore: () => ({ banReasonTranslations: [] }) }));
// The profile link goes through url-functions, which reads window._env_ at import.
vi.mock("@/config/env", () => ({ INGAME_STATIC_RESOURCES_URL: "/mock/" }));

import BanAccountView from "./BanAccountView.vue";

type ViewProps = InstanceType<typeof BanAccountView>["$props"];

const tableStub = { name: "BanTable", props: ["showPager", "bans", "scope", "sort"], template: "<div class='table-stub' />" };

let wrapper: VueWrapper;
const mounted: VueWrapper[] = [];

function mountView(account: AccountView, props: Partial<ViewProps> = {}): VueWrapper {
  wrapper = mount(BanAccountView, {
    props: { account, bans: [], total: account.counts.total, query: { ...DEFAULT_PAGE_QUERY, account: account.accountKey }, loading: false, matchedTag: null, ...props },
    global: { plugins: banTestPlugins(), stubs: { BanTable: tableStub } },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

beforeEach(() => {
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation"];
});

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  document.body.innerHTML = "";
  vi.useRealTimers();
});

const button = (text: string) => wrapper.findAll("button").find((b) => b.text().includes(text))!;

/** Opens the select with this label and clicks the item with this text in its overlay (rendered in the body). */
async function selectItem(label: string, text: string): Promise<void> {
  const field = wrapper.findAll(".v-select").find((f) => f.text().includes(label))!;
  await field.find(".v-field").trigger("mousedown");
  await flushPromises();
  [...document.body.querySelectorAll<HTMLElement>(".v-list-item")].find((item) => item.textContent?.trim() === text)!.click();
  await flushPromises();
}

const name = (battleTag: string, banCount = 0, lastBannedAt: string | null = null, current = false): AccountName => ({ battleTag, banCount, lastBannedAt, current });

const twoBansAccount = (): AccountView =>
  accountView({
    accountKey: "1001",
    currentBattleTag: "Tester#1001",
    counts: { total: 2, inEffect: 2, expired: 0, revoked: 0 },
    inEffect: {
      global: { endDate: "2026-11-25T00:00:00.000Z", banId: "b1", by: "Mod Two" },
      modes: [{ gameMode: 2, endDate: "2026-12-05T00:00:00.000Z", banId: "b2", by: "Mod One" }],
      bans: [
        banSummary({ banId: "b2", gameModes: [2], endDate: "2026-12-05T00:00:00.000Z", issuedBy: "Mod One" }),
        banSummary({ banId: "b1", gameModes: [], endDate: "2026-11-25T00:00:00.000Z", issuedBy: "Mod Two" }),
      ],
    },
  });

test("the merged in-effect statement", () => {
  mountView(twoBansAccount());
  expect(wrapper.text()).toContain(txt("in_effect_now"));
  expect(wrapper.text()).toContain("Everything until 25 Nov · after that: 2 vs 2 until 5 Dec");
});

test("one ban in effect is stated too", () => {
  mountView(
    accountView({
      counts: { total: 1, inEffect: 1, expired: 0, revoked: 0 },
      inEffect: {
        global: { endDate: "2026-12-01T00:00:00.000Z", banId: "ban1", by: "Mod One" },
        modes: [],
        bans: [banSummary({ banId: "ban1", gameModes: [], endDate: "2026-12-01T00:00:00.000Z", issuedBy: "Mod One" })],
      },
    }),
  );
  expect(wrapper.text()).toContain(txt("in_effect_now"));
  expect(wrapper.text()).toContain("Everything until 1 Dec");
});

test("past bans only, and no bans at all, have their own sentences without the in-effect label", () => {
  mountView(accountView({ counts: { total: 3, inEffect: 0, expired: 2, revoked: 1 } }));
  expect(wrapper.text()).toContain(txt("no_ban_in_effect"));
  expect(wrapper.text()).not.toContain(txt("in_effect_now"));
  mountView(accountView({ counts: { total: 0, inEffect: 0, expired: 0, revoked: 0 } }));
  expect(wrapper.text()).toContain(txt("no_bans"));
  expect(wrapper.text()).not.toContain(txt("in_effect_now"));
});

test("names: four inline in order, the matched one bold, the panel on request", async () => {
  const names = [
    name("Tester#1006", 2, "2026-10-01T00:00:00.000Z"),
    name("Tester#1002"),
    name("Tester#1003"),
    name("Tester#1004"),
    name("Tester#1005", 1, "2026-11-10T00:00:00.000Z"),
    name("Tester#1001", 0, null, true),
  ];
  mountView(accountView({ names }), { matchedTag: "tester#1004" });
  const inline = wrapper.findAll(".account-names-inline .account-name").map((n) => n.text().split(" ")[0]);
  expect(inline).toEqual(["Tester#1001", "Tester#1004", "Tester#1005", "Tester#1006"]);
  expect(wrapper.find(".account-names-inline b").text()).toBe("Tester#1004");
  await button(txt("names_all", { count: 6 })).trigger("click");
  expect(wrapper.findAll(".account-names-grid .account-name").length).toBe(6);
  expect(wrapper.find(".account-names-panel input").exists()).toBe(false);
});

test("one name: no names line", () => {
  mountView(accountView({ names: [name("Tester#1001", 1, "2026-11-01T00:00:00.000Z", true)] }));
  expect(wrapper.find(".account-names-inline").exists()).toBe(false);
});

test("the names panel has a filter above 20 names", async () => {
  mountView(accountView({ names: Array.from({ length: 21 }, (_, i) => name(`Tester#${1001 + i}`, 0, null, i === 0)) }));
  await button(txt("names_all", { count: 21 })).trigger("click");
  await wrapper.find(".account-names-panel input").setValue("1021");
  expect(wrapper.findAll(".account-names-grid .account-name").map((n) => n.text().split(" ")[0])).toEqual(["Tester#1021"]);
  await wrapper.find(".account-names-panel input").setValue("zz");
  expect(wrapper.text()).toContain(txt("names_none_match"));
});

test("locked out by another account's machine ban: admins only", async () => {
  const locked = accountView({ lockedOutBy: [{ accountKey: "1002", battleTag: "Тестер#1002", banId: "b9" }] });
  oauth.permissions = ["Moderation"];
  const moderatorHtml = normalizedHtml(mountView(locked));
  expect(moderatorHtml).toBe(normalizedHtml(mountView(accountView())));
  oauth.permissions = ["Moderation", "AdminModeration"];
  mountView(locked);
  expect(wrapper.find("a.locked-out-link").text()).toBe("Тестер#1002");
  await wrapper.find("a.locked-out-link").trigger("click");
  expect(wrapper.emitted("openAccount")).toEqual([["1002"]]);
});

test("counts and the status filter appear only above 3 bans; the pager only above 25", () => {
  mountView(accountView({ counts: { total: 3, inEffect: 1, expired: 1, revoked: 1 } }), { total: 3 });
  expect(wrapper.text()).not.toContain(txt("account_order"));
  expect(wrapper.findComponent({ name: "BanTable" }).props("showPager")).toBe(false);
  mountView(accountView({ counts: { total: 30, inEffect: 4, expired: 20, revoked: 6 } }), { total: 30 });
  expect(wrapper.text()).toContain(txt("account_order"));
  expect(wrapper.findComponent({ name: "BanTable" }).props("showPager")).toBe(true);
});

test("the status filter starts at page 1", async () => {
  const query = { ...DEFAULT_PAGE_QUERY, account: "1001", page: 2 };
  mountView(accountView({ counts: { total: 30, inEffect: 4, expired: 20, revoked: 6 } }), { total: 30, query });
  await selectItem(txt("filter_status"), txt("status_option", { status: "Expired", count: 20 }));
  expect(wrapper.emitted("update:query")).toEqual([[{ ...query, status: "expired", page: 1 }]]);
});

test("the back link leads to the log", async () => {
  mountView(accountView());
  const back = wrapper.find("a.account-back");
  expect(back.attributes("href")).toBe("/admin/admin-banned-players");
  await back.trigger("click");
  expect(wrapper.emitted("back")).toEqual([[]]);
});

test("the profile link opens the current tag's profile", () => {
  mountView(accountView({ currentBattleTag: "Тестер#1002" }));
  const link = wrapper.find("a.account-profile");
  expect([link.attributes("href"), link.attributes("target")]).toEqual([`/player/${encodeURIComponent("Тестер#1002")}`, "_blank"]);
});

test("a status filter that leaves nothing says so instead of showing the table", () => {
  const account = accountView({ counts: { total: 30, inEffect: 4, expired: 20, revoked: 6 } });
  mountView(account, { total: 0, query: { ...DEFAULT_PAGE_QUERY, account: "1001", status: "revoked" } });
  expect(wrapper.text()).toContain(txt("no_bans_with_status"));
  expect(wrapper.findComponent({ name: "BanTable" }).exists()).toBe(false);
});

test("the table is the account's, unsorted by the log's sort, and its pager changes the page", () => {
  const query = { ...DEFAULT_PAGE_QUERY, account: "1001", page: 1 };
  mountView(accountView({ counts: { total: 30, inEffect: 4, expired: 20, revoked: 6 } }), { total: 30, query });
  const table = wrapper.findComponent({ name: "BanTable" });
  expect([table.props("scope"), table.props("sort")]).toEqual(["account", null]);
  table.vm.$emit("update:page", 2);
  expect(wrapper.emitted("update:query")).toEqual([[{ ...query, page: 2 }]]);
});
