// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { BanApiError } from "@/services/admin/banApiError";
import { accountView, banSummary, banView, FIXTURE_NOW, machineBanView } from "@/store/admin/bans/fixtures.testing";
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
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => oauth }));
// The real admin store pulls in AdminService, which reads window._env_ at import.
vi.mock("@/store/admin/store", () => ({ useAdminStore: () => ({ banReasonTranslations: [] }) }));

import RevokeDialog from "./RevokeDialog.vue";

let wrappers: VueWrapper[] = [];
let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation"];
  // A revoke reloads the list behind the dialog.
  service.list.mockResolvedValue({ bans: [], total: 0 });
});

afterEach(() => {
  wrappers.forEach((w) => w.unmount());
  wrappers = [];
  vi.useRealTimers();
});

function openRevoke(ban: BanView): VueWrapper {
  wrapper = mount(RevokeDialog, {
    props: { modelValue: true, ban },
    global: { plugins: banTestPlugins(), stubs: { VDialog: inlineDialog } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
async function mountRevoke(ban: BanView): Promise<VueWrapper> {
  openRevoke(ban);
  await flushPromises();
  return wrapper;
}

const note = (): DOMWrapper<HTMLInputElement> => wrapper.find(".revoke-note input");
const alert = () => wrapper.find(".revoke-dialog-error");
const confirmButton = (): DOMWrapper<HTMLButtonElement> => {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === txt("revoke_confirm"));
  if (!found) throw new Error("No confirm button");
  return found;
};
// jsdom does not submit a form from a Vuetify button click, so submit the form the way Enter would.
const confirm = () => wrapper.find("form").trigger("submit");

const plain = () => banView({ id: "ban1", accountKey: "1001", battleTag: "Tester#1001", currentBattleTag: "Tester#1001", gameModes: [], endDate: "2026-12-01T00:00:00.000Z", banReason: "Leaving games" });
const onlyThisBan = () =>
  accountView({
    accountKey: "1001",
    counts: { total: 1, inEffect: 1, expired: 0, revoked: 0 },
    inEffect: {
      global: { endDate: "2026-12-01T00:00:00.000Z", banId: "ban1", by: "Mod One" },
      modes: [],
      bans: [banSummary({ banId: "ban1", gameModes: [], endDate: "2026-12-01T00:00:00.000Z", issuedBy: "Mod One" })],
    },
  });
const twoBansAccount = () =>
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

test("the ban line, its reason and what remains on the account", async () => {
  service.account.mockResolvedValue(twoBansAccount());
  openRevoke(banView({ id: "b1", accountKey: "1001", battleTag: "Tester#1001", currentBattleTag: "Tester#1001", gameModes: [], endDate: "2026-11-25T00:00:00.000Z", banReason: "Leaving games" }));
  await flushPromises();
  expect(wrapper.find(".revoke-ban-line").text()).toBe("Banned as Tester#1001 · All game modes · 2026-11-25");
  expect(wrapper.text()).toContain("Leaving games");
  expect(wrapper.text()).toContain("After this, still in effect on this account: 2 vs 2 until 5 Dec");
});

test("a ban without a reason has no empty reason area", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  await mountRevoke(banView({ id: "ban1", accountKey: "1001", banReason: "" }));
  expect(wrapper.find(".revoke-reason").exists()).toBe(false);
});

test("revoking the only ban says nothing remains", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  await mountRevoke(plain());
  expect(wrapper.text()).toContain("After this, no ban remains in effect on this account.");
});

test("the note is required and at most 500 characters, and the field says why", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  await mountRevoke(plain());
  expect(wrapper.find(".revoke-note").text()).not.toContain(txt("problem_note_missing"));
  await note().setValue("  ");
  expect(confirmButton().element.disabled).toBe(true);
  expect(wrapper.find(".revoke-note").text()).toContain(txt("problem_note_missing"));
  await note().setValue("x".repeat(501));
  expect(confirmButton().element.disabled).toBe(true);
  expect(wrapper.find(".revoke-note").text()).toContain(txt("problem_note_too_long"));
  await note().setValue("appeal");
  expect(confirmButton().element.disabled).toBe(false);
  expect(wrapper.find(".revoke-note").text()).not.toContain(txt("problem_note_too_long"));
});

test("confirm revokes this one ban with the trimmed note and closes", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  service.revoke.mockResolvedValue(banView({ id: "ban1", status: "revoked" }));
  await mountRevoke(plain());
  await note().setValue(" appeal ");
  await confirm();
  await flushPromises();
  expect(service.revoke).toHaveBeenCalledWith("ban1", "appeal", "tok");
  expect(wrapper.emitted("revoked")?.[0]?.[0]).toMatchObject({ id: "ban1", status: "revoked" });
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

test("a ban that ended or was revoked meanwhile: the text, the dialog stays, confirm stays disabled", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  service.revoke.mockRejectedValue(new BanApiError(409, "BAN_NOT_IN_EFFECT", "x"));
  await mountRevoke(plain());
  await note().setValue("appeal");
  await confirm();
  await flushPromises();
  expect(alert().text()).toBe("This ban is no longer in effect: it ended or was revoked while you had it open. Nothing was saved.");
  expect(confirmButton().element.disabled).toBe(true);
  expect(wrapper.emitted("revoked")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("a failure that may have been saved says so and blocks a second try", async () => {
  service.account.mockResolvedValue(onlyThisBan());
  service.revoke.mockRejectedValue(new BanApiError(500, undefined, "x"));
  await mountRevoke(plain());
  await note().setValue("appeal");
  await confirm();
  await flushPromises();
  expect(alert().text()).toBe(txt("error_maybe_saved"));
  expect(confirmButton().element.disabled).toBe(true);
});

test("a moderator's machine ban looks like a regular ban until confirm, then the fixed refusal", async () => {
  oauth.permissions = ["Moderation"];
  service.account.mockResolvedValue(onlyThisBan());
  const asMachine = normalizedHtml(await mountRevoke(machineBanView({ ...plain() })));
  const asRegular = normalizedHtml(await mountRevoke(plain()));
  expect(asMachine).toBe(asRegular);
  service.revoke.mockRejectedValue(new BanApiError(403, "MACHINE_BAN_PERMISSION", "refused"));
  await mountRevoke(machineBanView({ ...plain() }));
  await note().setValue("appeal");
  await confirm();
  await flushPromises();
  expect(alert().text()).toBe("Permission denied, please contact an Administrator");
  expect(confirmButton().element.disabled).toBe(true);
});

test("an admin revoking a machine ban is told it lifts the IDs and to keep them out of the note", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  service.account.mockResolvedValue(onlyThisBan());
  await mountRevoke(machineBanView({ ...plain(), machine: { machineIds: ["aa11bb22", "cc33dd44"], newMachineIdCount: 0, changes: [], version: 1 } }));
  expect(wrapper.text()).toContain(txt("revoke_machine_other", { count: 2 }));
  expect(wrapper.text()).toContain(txt("revoke_note_hint"));
  const adminRegular = normalizedHtml(await mountRevoke(plain()));
  oauth.permissions = ["Moderation"];
  expect(adminRegular).toBe(normalizedHtml(await mountRevoke(plain())));
});

test("a failed account load still allows the revoke", async () => {
  const logged = vi.spyOn(console, "error").mockImplementation(() => undefined);
  service.account.mockRejectedValue(new BanApiError(503, "BANS_UNAVAILABLE", ""));
  service.revoke.mockResolvedValue(banView({ id: "ban1", status: "revoked" }));
  await mountRevoke(plain());
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load account bans in effect:", expect.any(BanApiError));
  expect(wrapper.text()).toContain("Bans are not available right now. Please tell an administrator.");
  await note().setValue("appeal");
  await confirm();
  await flushPromises();
  expect(service.revoke).toHaveBeenCalledWith("ban1", "appeal", "tok");
});
