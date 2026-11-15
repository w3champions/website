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
vi.mock("@/composables/GameModesMixin", () => ({
  activeGameModes: () => [{ id: 1, name: "1 vs 1" }, { id: 2, name: "2 vs 2" }, { id: 4, name: "4 vs 4" }],
}));

import BanDialog from "./BanDialog.vue";

const PICK_SLOT = "<button class=\"pick\" @click=\"params.pick({ accountKey: '1001', matchedBattleTag: 'Tester#1001', currentBattleTag: 'Tester#1001', nameCount: 1, bansInEffect: 0, bansTotal: 0 })\" />";

let wrappers: VueWrapper[] = [];
let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation"];
  service.list.mockResolvedValue({ bans: [], total: 0 });
});

afterEach(() => {
  wrappers.forEach((w) => w.unmount());
  wrappers = [];
  vi.useRealTimers();
});

function mountDialog(props: Record<string, unknown>, playerSlot = PICK_SLOT): VueWrapper {
  wrapper = mount(BanDialog, {
    props: { modelValue: true, mode: "add", ban: null, accountKey: null, initialDraft: null, ...props },
    slots: { player: playerSlot },
    global: { plugins: banTestPlugins(), stubs: { VDialog: inlineDialog } },
  });
  wrappers.push(wrapper);
  return wrapper;
}
const openAdd = (props: { accountKey: string | null }) => mountDialog({ mode: "add", ...props });
const openEdit = (ban: BanView) => mountDialog({ mode: "edit", ban });
async function mountEdit(ban: BanView): Promise<VueWrapper> {
  openEdit(ban);
  await flushPromises();
  return wrapper;
}

const reason = () => wrapper.find(".ban-field-reason textarea");
const freeText = () => wrapper.find(".ban-field-shown-free input");
const translationSelect = () => wrapper.find(".ban-field-shown-translation");
const endField = () => wrapper.find(".ban-field-end input[type='datetime-local']");
const alert = () => wrapper.find(".ban-dialog-error");
const saveButton = (): DOMWrapper<HTMLButtonElement> => {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === txt("save"));
  if (!found) throw new Error("No Save button");
  return found;
};
// jsdom does not submit a form from a Vuetify button click, so submit the form the way Enter would.
const save = () => wrapper.find("form").trigger("submit");
const chooseAllModes = () => wrapper.find("input[type='radio'][value='all']").setValue(true);
const chooseDuration = async (days: number) => {
  const chip = wrapper.findAll(".ban-field-end .v-chip").find((c) => c.text().trim() === `${days} days`);
  if (!chip) throw new Error(`No chip for ${days} days`);
  await chip.trigger("click");
};
const order = (...selectors: string[]): boolean => {
  const nodes = selectors.map((s) => wrapper.find(s).element);
  return nodes.every((node, i) => i === 0 || Boolean(nodes[i - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
};

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

const edited = () => banView({ id: "ban1", accountKey: "1001", gameModes: [2], banReason: "Leaving games", endDate: "2026-12-01T00:00:00.000Z", version: 3 });
async function editAndSave(rejection: unknown) {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.edit.mockRejectedValue(rejection);
  openEdit(edited());
  await flushPromises();
  await reason().setValue("new");
  await save();
  await flushPromises();
}

test("Add: Save on an empty form sends nothing and names what is missing", async () => {
  openAdd({ accountKey: null });
  await save();
  for (const text of ["Pick a player.", "Choose “Only these modes” or “All game modes”.", "Choose when the ban ends.", "The internal reason is required."]) {
    expect(wrapper.text()).toContain(text);
  }
  expect(service.create).not.toHaveBeenCalled();
});

test("Add from an account: locked player, account box, the overlap under modes and duration, and the contract request", async () => {
  service.account.mockResolvedValue(twoBansAccount());
  service.create.mockResolvedValue(banView({ id: "new" }));
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
  expect(wrapper.find(".pick").exists()).toBe(false);
  expect(wrapper.text()).toContain("In effect on this account: Everything until 25 Nov · after that: 2 vs 2 until 5 Dec");
  await chooseAllModes();
  await chooseDuration(14);
  await reason().setValue(" grief ");
  expect(order(".ban-field-modes", ".ban-field-end", ".ban-overlap", ".ban-field-reason")).toBe(true);
  expect(wrapper.find(".ban-overlap").text()).toContain("Already banned:");
  expect(wrapper.find(".ban-overlap").text()).toContain("Everything until 25 Nov (Mod Two)");
  await save();
  await flushPromises();
  expect(service.create).toHaveBeenCalledWith(
    { accountKey: "1001", type: "regular", allGameModes: true, gameModes: [], permanent: false, endDate: "2026-11-29T12:00:00.000Z", banReason: "grief" },
    "tok",
  );
  expect(wrapper.emitted("saved")).toEqual([[banView({ id: "new" })]]);
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

test("Add without an account: the page's player slot is shown and a pick loads that account", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openAdd({ accountKey: null });
  expect(wrapper.find(".pick").exists()).toBe(true);
  await wrapper.find(".pick").trigger("click");
  await flushPromises();
  expect(service.account).toHaveBeenCalledWith("1001", "tok");
});

test("a pick inside the dialog shows the picked account's current tag", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001", currentBattleTag: "Tester#1001" }));
  openAdd({ accountKey: null });
  expect(wrapper.find(".ban-field-picked").exists()).toBe(false);
  await wrapper.find(".pick").trigger("click");
  await flushPromises();
  expect(wrapper.find(".ban-field-picked b").text()).toBe("Tester#1001");
  expect(wrapper.find(".ban-field-picked").text()).not.toContain(txt("picked_found_as", { tag: "Tester#1001" }));
});

test("a pick by an older name shows the current tag and the matched name", async () => {
  const oldNameSlot = PICK_SLOT.replace("matchedBattleTag: 'Tester#1001'", "matchedBattleTag: 'OldName#1001'");
  service.account.mockResolvedValue(accountView({ accountKey: "1001", currentBattleTag: "Tester#1001" }));
  mountDialog({ mode: "add", accountKey: null }, oldNameSlot);
  await wrapper.find(".pick").trigger("click");
  await flushPromises();
  expect(wrapper.find(".ban-field-picked b").text()).toBe("Tester#1001");
  expect(wrapper.find(".ban-field-picked").text()).toContain(txt("picked_found_as", { tag: "OldName#1001" }));
});

test("opening with a new player in the same tick loads the account once", async () => {
  oauth.permissions = ["Moderation", "AdminModeration"];
  service.account.mockResolvedValue(accountView({ accountKey: "1002" }));
  service.machineIds.mockResolvedValue([]);
  mountDialog({ modelValue: false, accountKey: "1001" });
  await flushPromises();
  expect(service.account).not.toHaveBeenCalled();
  await wrapper.setProps({ modelValue: true, accountKey: "1002" });
  await flushPromises();
  expect(service.account).toHaveBeenCalledExactlyOnceWith("1002", "tok");
  expect(service.machineIds).toHaveBeenCalledTimes(1);
});

test("Edit that ban instead emits the ban's id and its account", async () => {
  service.account.mockResolvedValue(twoBansAccount());
  openAdd({ accountKey: "1001" });
  await flushPromises();
  await chooseAllModes();
  await chooseDuration(14);
  await wrapper.find(".ban-overlap").findAll("button").find((b) => b.text() === "Edit that ban instead")!.trigger("click");
  expect(wrapper.emitted("editInstead")).toEqual([["b1", "1001"]]);
});

test("Edit that ban instead after a pick in the dialog names the picked account", async () => {
  service.account.mockResolvedValue(twoBansAccount());
  openAdd({ accountKey: null });
  await wrapper.find(".pick").trigger("click");
  await flushPromises();
  await chooseAllModes();
  await chooseDuration(14);
  await wrapper.find(".ban-overlap").findAll("button").find((b) => b.text() === "Edit that ban instead")!.trigger("click");
  expect(wrapper.emitted("editInstead")).toEqual([["b1", "1001"]]);
});

test("only one of free text and predefined translation can be filled", async () => {
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(wrapper.text()).toContain(txt("shown_none_hint"));
  await freeText().setValue("x");
  expect(translationSelect().classes()).toContain("v-input--disabled");
  expect(wrapper.text()).not.toContain(txt("shown_none_hint"));
  await freeText().setValue("");
  expect(translationSelect().classes()).not.toContain("v-input--disabled");
});

test("Edit: prefilled, Save only after a real change, and only the change is sent", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.edit.mockResolvedValue(edited());
  openEdit(edited());
  await flushPromises();
  expect((reason().element as HTMLTextAreaElement).value).toBe("Leaving games");
  expect(saveButton().element.disabled).toBe(true);
  await reason().setValue("new");
  await save();
  await flushPromises();
  expect(service.edit).toHaveBeenCalledWith("ban1", { version: 3, banReason: "new" }, "tok");
});

test("Edit: an end in the past points to Revoke", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openEdit(edited());
  await flushPromises();
  await endField().setValue("2026-11-15T11:00");
  await save();
  expect(wrapper.text()).toContain("The end must be in the future. To end a ban now, use Revoke.");
  expect(service.edit).not.toHaveBeenCalled();
});

test("a ban changed meanwhile: the conflict text, nothing overwritten, Save stays disabled", async () => {
  await editAndSave(new BanApiError(409, "BAN_VERSION_CONFLICT", "stale"));
  expect(alert().text()).toBe("Someone else changed this ban while you had it open. Nothing was saved. Close this dialog and open the ban again to see the change.");
  expect(saveButton().element.disabled).toBe(true);
  expect(wrapper.emitted("saved")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("a ban that ended or was revoked meanwhile is refused the same way", async () => {
  await editAndSave(new BanApiError(409, "BAN_NOT_IN_EFFECT", "x"));
  expect(alert().text()).toBe("This ban is no longer in effect: it ended or was revoked while you had it open. Nothing was saved.");
  expect(saveButton().element.disabled).toBe(true);
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("a save that may have gone through says so and cannot be repeated blindly", async () => {
  await editAndSave(new TypeError("Failed to fetch"));
  expect(alert().text()).toBe("The change may have been saved. The list was reloaded: check it before trying again.");
  expect(saveButton().element.disabled).toBe(true);
});

test("a refused value keeps the dialog open and Save enabled", async () => {
  await editAndSave(new BanApiError(400, "VALIDATION", "endDate must be in the future"));
  expect(alert().text()).toBe("endDate must be in the future");
  expect(saveButton().element.disabled).toBe(false);
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("a moderator's machine ban looks like a regular ban until Save, then the fixed refusal", async () => {
  oauth.permissions = ["Moderation"];
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  const asMachine = normalizedHtml(await mountEdit(machineBanView({ id: "ban1", version: 3 })));
  const asRegular = normalizedHtml(await mountEdit(banView({ id: "ban1", version: 3 })));
  expect(asMachine).toBe(asRegular);
  service.edit.mockRejectedValue(new BanApiError(403, "MACHINE_BAN_PERMISSION", "refused"));
  await reason().setValue("new");
  await save();
  await flushPromises();
  expect(alert().text()).toBe("Permission denied, please contact an Administrator");
  expect(service.machineIds).not.toHaveBeenCalled();
});

test("a moderator's Add has no ban type and loads no machine data", async () => {
  oauth.permissions = ["Moderation"];
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(wrapper.text()).not.toContain(txt("field_type"));
  expect(service.machineIds).not.toHaveBeenCalled();
});

test("an account with no bans shows only the single line in the box", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(wrapper.find(".ban-account-box").text()).toBe(txt("no_bans"));
});

test("Save is a submit button", () => {
  openAdd({ accountKey: "1001" });
  expect(saveButton().attributes("type")).toBe("submit");
});

test("a ban swapped on an open dialog replaces the form and the account", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openEdit(edited());
  await flushPromises();
  await reason().setValue("typed");
  service.account.mockResolvedValue(accountView({ accountKey: "1002" }));
  await wrapper.setProps({ ban: banView({ id: "ban2", accountKey: "1002", banReason: "Other reason", version: 5 }) });
  await flushPromises();
  expect(service.account).toHaveBeenLastCalledWith("1002", "tok");
  expect((reason().element as HTMLTextAreaElement).value).toBe("Other reason");
  expect(saveButton().element.disabled).toBe(true);
});
