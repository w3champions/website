// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { formatUtc } from "@/helpers/utc-dates";
import { accountView, banView, FIXTURE_NOW, machineBanView } from "@/store/admin/bans/fixtures.testing";
import type { BanView } from "@/store/admin/bans/types";
import { banTestPlugins, inlineDialog, normalizedHtml, txt } from "./setup.testing";

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

// The real admin store pulls in AdminService, which needs window._env_.
vi.mock("@/store/admin/store", () => ({ useAdminStore: () => ({ banReasonTranslations: [] }) }));

import BanTable from "./BanTable.vue";

type TableProps = InstanceType<typeof BanTable>["$props"];

let wrapper: VueWrapper;
const mounted: VueWrapper[] = [];
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalClientWidth = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");

beforeEach(() => {
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation"];
  service.account.mockReset().mockResolvedValue(accountView({ accountKey: "1001" }));
});

afterEach(() => {
  mounted.splice(0).forEach((w) => w.unmount());
  vi.useRealTimers();
  if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  if (originalClientWidth) Object.defineProperty(Element.prototype, "clientWidth", originalClientWidth);
});

function mountTable(bans: BanView[], props: Partial<TableProps> = {}): VueWrapper {
  wrapper = mount(BanTable, {
    props: { bans, total: bans.length, scope: "log", page: 1, sort: null, dir: "desc", loading: false, showPager: false, ...props },
    global: { plugins: banTestPlugins(), stubs: { VDialog: inlineDialog } },
    attachTo: document.body,
  });
  mounted.push(wrapper);
  return wrapper;
}

const row = (id: string) => wrapper.find(`tr[data-ban-id="${id}"]`);
const header = (text: string) => wrapper.findAll("th").find((th) => th.text().includes(text))!;
const button = (w: { findAll(s: string): { text(): string; trigger(e: string): Promise<void> }[] }, text: string) => w.findAll("button").find((b) => b.text().includes(text))!;

async function openRow(id: string): Promise<void> {
  await row(id).find(`button[aria-label="${txt("action_open")}"]`).trigger("click");
  await flushPromises();
}

async function mountOpened(ban: BanView, props: Partial<TableProps> = {}): Promise<VueWrapper> {
  const w = mountTable([ban], props);
  await openRow(ban.id);
  return w;
}

function stubWidths(widths: { chip: number; plus: number; cell: number }): void {
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return this.classList.contains("ban-measure-plus") ? widths.plus : widths.chip;
    },
  });
  Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, get: () => widths.cell });
}

const by = { issuedBy: "Mod One", lastChange: { kind: "issued", at: "2026-11-01T00:00:00.000Z", by: "Mod One" } } as const;
const revokedBy = { at: "2026-11-15T10:02:00.000Z", by: "Mod Two", note: "appeal" };

test("status is shown by the edge colour class and by words under the end", () => {
  mountTable([
    banView({ ...by, id: "a", endDate: "2026-12-01T00:00:00.000Z" }),
    banView({ ...by, id: "b", status: "expired", endDate: "2026-11-12T12:00:00.000Z" }),
    banView({ ...by, id: "c", status: "revoked", revoked: revokedBy }),
  ]);
  expect(row("a").classes()).toContain("ban-row--inEffect");
  expect(row("a").text()).toContain("2026-12-01");
  expect(row("a").text()).toContain("16 days left");
  expect(row("b").classes()).toContain("ban-row--expired");
  expect(row("b").text()).toContain("expired 3 d ago");
  expect(row("c").find(".ban-ends--struck").exists()).toBe(true);
  expect(row("c").text()).toContain("revoked 15 Nov");
});

test("the other bans in effect are a compact +N badge and line 2 holds only the current tag", () => {
  mountTable([
    banView({ id: "a", battleTag: "Tester#1001", otherBansInEffect: 3, currentBattleTag: "Тестер#1002" }),
    banView({ id: "b", battleTag: "Tester#1001", currentBattleTag: "tester#1001" }),
  ]);
  expect(row("a").find(".ban-others").text()).toBe("+3");
  expect(row("a").find(".ban-others").attributes("tabindex")).toBe("0");
  expect(row("a").text()).toContain(txt("now_tag", { tag: "Тестер#1002" }));
  expect(row("b").text()).not.toContain(txt("now_tag", { tag: "tester#1001" })); // case only: not a rename
});

test("Edit and Revoke exist only on bans in effect and emit the ban", async () => {
  const a = banView({ id: "a", status: "inEffect", endDate: "2026-12-01T00:00:00.000Z" });
  mountTable([a, banView({ id: "b", status: "expired" }), banView({ id: "c", status: "revoked", revoked: revokedBy })]);
  await row("a").find(`button[aria-label="${txt("action_edit")}"]`).trigger("click");
  await row("a").find(`button[aria-label="${txt("action_revoke")}"]`).trigger("click");
  expect(wrapper.emitted("edit")).toEqual([[a]]);
  expect(wrapper.emitted("revoke")).toEqual([[a]]);
  for (const id of ["b", "c"]) expect(row(id).findAll("button").length).toBe(1); // only the arrow
});

test("last change names the action, the time and who, with the issuer only when someone else", () => {
  mountTable([
    banView({ id: "ban1", issuedBy: "Helper(bot)", lastChange: { kind: "edited", at: "2026-11-15T09:10:00.000Z", by: "Mod Two" } }),
    banView({ ...by, id: "b" }),
  ]);
  expect(row("ban1").text()).toContain("Edited 15 Nov 09:10");
  expect(row("ban1").text()).toContain("Mod Two · issued by Helper(bot)");
  expect(row("b").text()).toContain("1 Nov 00:00");
  expect(row("b").text()).not.toContain("issued by");
});

test("a revoke updates the row in place: same position, still open, no actions", async () => {
  const live = { status: "inEffect", endDate: "2026-12-01T00:00:00.000Z" } as const;
  mountTable([banView({ ...live, id: "a" }), banView({ ...live, id: "b" }), banView({ ...live, id: "c" })]);
  await openRow("b");
  await wrapper.setProps({
    bans: [banView({ id: "a" }), banView({ id: "b", status: "revoked", revoked: { ...revokedBy, at: "2026-11-15T11:00:00.000Z" } }), banView({ id: "c" })],
  });
  expect(wrapper.findAll("tr[data-ban-id]").map((r) => r.attributes("data-ban-id"))).toEqual(["a", "b", "c"]);
  expect(row("b").classes()).toContain("ban-row--revoked");
  expect(row("b").findAll("button").length).toBe(1); // only the arrow
  // the opened row stayed open
  expect(wrapper.text()).toContain(txt("detail_revoked", { when: formatUtc("2026-11-15T11:00:00.000Z"), by: "Mod Two", note: "appeal" }));
});

test("a moderator sees a machine ban exactly as a regular global ban, opened row included", async () => {
  oauth.permissions = ["Moderation"];
  const machine = await mountOpened(machineBanView({ id: "x" }));
  const regular = await mountOpened(banView({ id: "x" }));
  expect(normalizedHtml(machine)).toBe(normalizedHtml(regular));
});

test("an admin sees the machine chip and the machine IDs; on a regular ban nothing more than a moderator", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  const machine = await mountOpened(machineBanView({ machine: { machineIds: ["aa11bb22", "cc33dd44"], newMachineIdCount: 1, changes: [], version: 1 } }));
  expect(machine.text()).toContain(txt("machine_chip_new", { count: 2, new: 1 }));
  expect(machine.findAll("code").map((c) => c.text())).toEqual(["aa11bb22", "cc33dd44"]);
  const adminRegular = normalizedHtml(await mountOpened(banView()));
  oauth.permissions = ["Moderation"];
  expect(adminRegular).toBe(normalizedHtml(await mountOpened(banView())));
});

test("the opened row puts banned-as and issued on separate lines and shows the change old → new", async () => {
  const w = await mountOpened(banView({
    ...by,
    battleTag: "Tester#1001",
    currentBattleTag: "Тестер#1002",
    issuedAt: "2026-11-01T00:00:00.000Z",
    changes: [{ at: "2026-11-10T08:00:00.000Z", by: "Mod Two", field: "endDate", old: null, new: "2026-12-01T00:00:00.000Z" }],
  }));
  const lines = w.findAll(".ban-record-line").map((l) => l.text());
  expect(lines.slice(0, 2)).toEqual(["Banned as Tester#1001 (now Тестер#1002)", "Issued 2026-11-01 00:00 UTC by Mod One"]);
  expect(w.find(".ban-change s").text()).toBe("Permanent");
  expect(w.find(".ban-change b").text()).toBe("2026-12-01");
});

test("the account line says when there is nothing else, and otherwise links to the account", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001", counts: { total: 1, inEffect: 1, expired: 0, revoked: 0 } }));
  expect((await mountOpened(banView({ accountKey: "1001" }))).text()).toContain(txt("detail_account_single"));
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
  service.account.mockResolvedValue(accountView({
    accountKey: "1001",
    counts: { total: 4, inEffect: 2, expired: 1, revoked: 1 },
    names: [
      { battleTag: "Tester#1001", banCount: 4, lastBannedAt: "2026-11-01T00:00:00.000Z", current: true },
      { battleTag: "Тестер#1002", banCount: 0, lastBannedAt: null, current: false },
    ],
  }));
  const w = await mountOpened(banView({ accountKey: "1001" }));
  expect(w.text()).toContain(txt("detail_account_counts", { bans: txt("bans_other", { count: 4 }), inEffect: 2, expired: 1, revoked: 1 }));
  await w.find("a.ban-open-account").trigger("click");
  expect(wrapper.emitted("openAccount")).toEqual([["1001"]]);
});

test("the account line shows a small spinner while it loads", async () => {
  service.account.mockReturnValue(new Promise(() => {}));
  const w = await mountOpened(banView({ accountKey: "1001" }));
  expect(w.find(".ban-account-loading").exists()).toBe(true);
  expect(w.text()).not.toContain(txt("detail_account_single"));
});

test("Ban again is offered on expired and revoked bans only", async () => {
  expect((await mountOpened(banView({ id: "a", status: "inEffect", endDate: "2026-12-01T00:00:00.000Z" }))).text()).not.toContain(txt("ban_again"));
  const expired = banView({ id: "b", status: "expired" });
  const w = await mountOpened(expired);
  await button(w, txt("ban_again")).trigger("click");
  expect(wrapper.emitted("banAgain")).toEqual([[expired]]);
});

test("the account scope has no second line, no +N and no account line", async () => {
  mountTable([banView({ id: "ban1", battleTag: "Tester#1001", otherBansInEffect: 2, currentBattleTag: "Тестер#1002" })], { scope: "account" });
  await openRow("ban1");
  expect(wrapper.find("thead").text()).toContain(txt("col_banned_as"));
  expect(wrapper.find(".ban-others").exists()).toBe(false);
  // The opened row's record line still names the current tag ("Banned as … (now …)"); the row's cells do not.
  expect(row("ban1").text()).not.toContain(txt("now_tag", { tag: "Тестер#1002" }));
  expect(service.account).not.toHaveBeenCalled();
});

test("Ends and Last change sort on the server, newest first on the first click", async () => {
  mountTable([banView()]);
  await header(txt("col_ends")).trigger("click");
  expect(wrapper.emitted("update:sort")).toEqual([[{ sort: "ends", dir: "desc" }]]);
});

test("mode chips hide behind +N by measured width and report the cut", async () => {
  stubWidths({ chip: 60, plus: 30, cell: 150 });
  mountTable([banView({ id: "ban1", gameModes: [1, 2, 4] })]);
  await flushPromises();
  expect(row("ban1").findAll(".ban-mode:not(.ban-mode--hidden)").length).toBe(1);
  expect(row("ban1").find(".ban-mode--plus").text()).toBe("+2");
  expect(row("ban1").find(".ban-mode--plus").attributes("tabindex")).toBe("0");
});

test("a global ban shows All", () => {
  mountTable([banView({ id: "ban1", gameModes: [] })]);
  expect(row("ban1").findAll(".ban-mode").map((c) => c.text())).toEqual(["All"]);
});
