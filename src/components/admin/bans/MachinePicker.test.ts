// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { Plugin } from "vue";
import { BanApiError } from "@/services/admin/banApiError";
import { useBanDialogStore } from "@/store/admin/bans/dialogStore";
import { accountView, banSummary, banView, FIXTURE_NOW, machineBanView, machineIdRow } from "@/store/admin/bans/fixtures.testing";
import { initialPicker, type PickerState } from "@/store/admin/bans/machinePicker";
import type { AccountView, BanView } from "@/store/admin/bans/types";
import { banTestPlugins, inlineDialog, txt } from "./setup.testing";

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
import MachinePicker from "./MachinePicker.vue";

const MACHINE_DATA_UNAVAILABLE = "Machine data is not available right now, so nothing with machine IDs can be read or saved. Regular bans still work. Try again later.";

const pickButton = (accountKey: string, tag: string) => `<button class="pick-${accountKey}" @click="params.pick({ accountKey: '${accountKey}', matchedBattleTag: '${tag}', currentBattleTag: '${tag}', nameCount: 1, bansInEffect: 0, bansTotal: 0 })" />`;
const PICK_SLOT = pickButton("1001", "Tester#1001") + pickButton("1002", "Тестер#1002");

let plugins: Plugin[];
let wrappers: VueWrapper[] = [];
let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers({ now: FIXTURE_NOW, toFake: ["Date"] });
  oauth.permissions = ["Moderation", "AdminModeration"];
  service.list.mockResolvedValue({ bans: [], total: 0 });
  plugins = banTestPlugins();
});

afterEach(() => {
  wrappers.forEach((w) => w.unmount());
  wrappers = [];
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const rows = [
  machineIdRow({ machineId: "aa11bb22", firstUsed: "2026-03-02T00:00:00.000Z", lastUsed: "2026-11-14T00:00:00.000Z", recommended: true, shared: false, otherAccountCount: 2 }),
  machineIdRow({ machineId: "cc33dd44", firstUsed: "2026-03-02T00:00:00.000Z", lastUsed: "2026-06-01T00:00:00.000Z", recommended: false, shared: false, otherAccountCount: 0 }),
];

function track(w: VueWrapper): VueWrapper {
  wrapper = w;
  wrappers.push(w);
  return w;
}
function mountDialog(props: Record<string, unknown>): VueWrapper {
  return track(mount(BanDialog, {
    props: { modelValue: true, mode: "add", ban: null, accountKey: null, initialDraft: null, ...props },
    global: { plugins, stubs: { VDialog: inlineDialog } },
  }));
}
const openAdd = (props: { accountKey: string | null }) => mountDialog({ mode: "add", ...props });
const openEdit = (ban: BanView) => mountDialog({ mode: "edit", ban });

async function mountPicker(state: PickerState) {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockResolvedValue(rows);
  service.machineImpact.mockResolvedValue({ otherAccounts: 0, capped: false });
  await useBanDialogStore().open("1001", { machineAccess: true });
  track(mount(MachinePicker, { props: { modelValue: state }, global: { plugins } }));
  await flushPromises();
}

const reason = () => wrapper.find(".ban-field-reason textarea");
const alert = () => wrapper.find(".ban-dialog-error");
const button = (text: string): DOMWrapper<HTMLButtonElement> => {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === text);
  if (!found) throw new Error(`No button "${text}"`);
  return found;
};
const saveButton = (): DOMWrapper<HTMLButtonElement> => wrapper.find("button[type='submit']");
// jsdom does not submit a form from a Vuetify button click, so submit the form the way Enter would.
const save = () => wrapper.find("form").trigger("submit");
const chooseAllModes = () => wrapper.find("input[type='radio'][value='all']").setValue(true);
const chooseDuration = async (choice: number | "permanent") => {
  const label = choice === "permanent" ? txt("permanent") : `${choice} days`;
  const chip = wrapper.findAll(".ban-field-end .v-chip").find((c) => c.text().trim() === label);
  if (!chip) throw new Error(`No chip for ${label}`);
  await chip.trigger("click");
};
const radio = (label: string): DOMWrapper<HTMLInputElement> => {
  const found = wrapper.findAll(".ban-field-type .v-radio").find((r) => r.find("label").text().trim() === label);
  if (!found) throw new Error(`No radio "${label}"`);
  return found.find("input[type='radio']");
};
const chooseType = (label: string) => radio(label).setValue(true);
const rowOf = (machineId: string) => wrapper.find(`tr[data-machine-id='${machineId}']`);
const tick = async (machineId: string) => {
  const box = rowOf(machineId).find<HTMLInputElement>("input[type='checkbox']");
  await box.setValue(!box.element.checked);
  await flushPromises();
};
const lastState = (): PickerState => {
  const emitted = wrapper.emitted("update:modelValue");
  if (!emitted) throw new Error("The picker emitted nothing");
  return emitted.at(-1)![0] as PickerState;
};
const order = (...selectors: string[]): boolean => {
  const nodes = selectors.map((s) => wrapper.find(s).element);
  return nodes.every((node, i) => i === 0 || Boolean(nodes[i - 1].compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING));
};
/** The data lane logs every failed load; the tests that refuse the machine IDs expect exactly that line. */
const expectMachineLoadLogged = () => vi.spyOn(console, "error").mockImplementation(() => undefined);

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

async function machineAdd(account: AccountView = accountView({ accountKey: "1001" })) {
  service.account.mockResolvedValue(account);
  service.machineIds.mockResolvedValue(rows);
  service.machineImpact.mockResolvedValue({ otherAccounts: 2, capped: false });
  openAdd({ accountKey: "1001" });
  await flushPromises();
  await chooseType(txt("type_machine"));
  await flushPromises();
}

test("Machine ban: the picker replaces the game modes right under the type, with the recommended IDs ticked and the collateral on Save", async () => {
  await machineAdd();
  expect(wrapper.find(".ban-field-modes").exists()).toBe(false);
  expect(order(".ban-account-box", ".ban-field-type", ".machine-picker", ".ban-field-end")).toBe(true);
  expect(service.machineImpact).toHaveBeenLastCalledWith("1001", ["aa11bb22"], "tok");
  expect(saveButton().text()).toBe("Ban account + 1 machine · locks out at least 2 other accounts");
  expect(wrapper.text()).toContain(txt("machine_reasons_hint"));
  expect(order(".machine-reasons-hint", ".ban-field-reason")).toBe(true);
});

test("a machine ban saves the ticked IDs as a global ban", async () => {
  await machineAdd();
  service.create.mockResolvedValue(machineBanView({ id: "new" }));
  await chooseDuration(7);
  await reason().setValue("grief");
  await save();
  await flushPromises();
  expect(service.create).toHaveBeenCalledWith(
    { accountKey: "1001", type: "machine", allGameModes: true, gameModes: [], permanent: false, endDate: "2026-11-22T12:00:00.000Z", banReason: "grief", machineIds: ["aa11bb22"] },
    "tok",
  );
});

test("switching back to a regular ban brings the game modes back and drops the picker", async () => {
  await machineAdd();
  await chooseType(txt("type_regular"));
  expect(wrapper.find(".machine-picker").exists()).toBe(false);
  expect(wrapper.find(".ban-field-modes").exists()).toBe(true);
  expect(saveButton().text()).toBe(txt("save"));
});

test("the overlap notice for a machine ban is the one line, without an edit link", async () => {
  await machineAdd(twoBansAccount());
  await chooseDuration("permanent");
  expect(wrapper.find(".ban-overlap").text()).toBe("Already banned from everything until 25 Nov. The machine ban runs alongside.");
  expect(wrapper.find(".ban-overlap").findAll("button").length).toBe(0);
});

test("machine data unavailable: the machine type is disabled and says why, a regular ban still saves", async () => {
  const logged = expectMachineLoadLogged();
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockRejectedValue(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", ""));
  service.create.mockResolvedValue(banView());
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load machine IDs:", expect.any(BanApiError));
  expect(radio(txt("type_machine")).element.disabled).toBe(true);
  expect(radio(txt("type_regular")).element.disabled).toBe(false);
  expect(wrapper.text()).toContain(MACHINE_DATA_UNAVAILABLE);
  await chooseType(txt("type_regular"));
  await chooseAllModes();
  await chooseDuration(7);
  await reason().setValue("grief");
  await save();
  await flushPromises();
  expect(service.create.mock.calls[0][0].type).toBe("regular");
});

test("Retry asks for the machine IDs again and enables the machine type once they arrive", async () => {
  const logged = expectMachineLoadLogged();
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockRejectedValueOnce(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", "")).mockResolvedValue(rows);
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load machine IDs:", expect.any(BanApiError));
  await button(txt("retry")).trigger("click");
  await flushPromises();
  expect(service.machineIds).toHaveBeenCalledTimes(2);
  expect(radio(txt("type_machine")).element.disabled).toBe(false);
  expect(wrapper.text()).not.toContain(MACHINE_DATA_UNAVAILABLE);
});

test("an admin's Add shows no ban type before a player is picked", async () => {
  openAdd({ accountKey: null });
  await flushPromises();
  expect(wrapper.find(".ban-field-type").exists()).toBe(false);
  expect(service.machineIds).not.toHaveBeenCalled();
});

test("picking another player while a machine ban is drafted starts over with a regular ban", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockResolvedValue(rows);
  service.machineImpact.mockResolvedValue({ otherAccounts: 0, capped: false });
  track(mount(BanDialog, {
    props: { modelValue: true, mode: "add", ban: null, accountKey: null, initialDraft: null },
    slots: { player: PICK_SLOT },
    global: { plugins, stubs: { VDialog: inlineDialog } },
  }));
  await wrapper.find(".pick-1001").trigger("click");
  await flushPromises();
  await chooseType(txt("type_machine"));
  await flushPromises();
  expect(wrapper.find(".machine-picker").exists()).toBe(true);
  service.account.mockResolvedValue(accountView({ accountKey: "1002", currentBattleTag: "Тестер#1002" }));
  await wrapper.find(".pick-1002").trigger("click");
  await flushPromises();
  expect(service.machineIds).toHaveBeenLastCalledWith("1002", "tok");
  expect(wrapper.find(".machine-picker").exists()).toBe(false);
  expect(radio(txt("type_regular")).element.checked).toBe(true);
  expect(wrapper.find(".ban-field-modes").exists()).toBe(true);
});

test("while the machine IDs load, the machine type is disabled and says so", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockReturnValue(new Promise(() => undefined));
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(radio(txt("type_machine")).element.disabled).toBe(true);
  expect(wrapper.text()).toContain(txt("type_machine_loading"));
});

test("a machine ban refused because machine data went away keeps the dialog open and Save enabled", async () => {
  await machineAdd();
  await chooseDuration(7);
  await reason().setValue("grief");
  service.create.mockRejectedValue(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", ""));
  await save();
  await flushPromises();
  expect(alert().text()).toBe(MACHINE_DATA_UNAVAILABLE);
  expect(saveButton().element.disabled).toBe(false);
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("no machine IDs recorded: the type is disabled with that explanation", async () => {
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockResolvedValue([]);
  openAdd({ accountKey: "1001" });
  await flushPromises();
  expect(radio(txt("type_machine")).element.disabled).toBe(true);
  expect(wrapper.text()).toContain("No machine IDs recorded for this account.");
});

test("Edit: an unticked ID of the ban stays in place, marked, and the footer counts the change", async () => {
  await mountPicker(initialPicker(rows, ["aa11bb22", "cc33dd44"], "2026-11-01T00:00:00.000Z"));
  await tick("cc33dd44");
  const emitted = lastState();
  await wrapper.setProps({ modelValue: emitted });
  expect(wrapper.findAll("tr[data-machine-id]").map((r) => r.attributes("data-machine-id"))).toEqual(["aa11bb22", "cc33dd44"]);
  expect(rowOf("cc33dd44").text()).toContain("Will be removed from this ban");
  expect(wrapper.find(".picker-footer").text()).toContain("1 removed, 0 added");
  expect(wrapper.text()).toContain("Reset to this ban's IDs");
  expect(wrapper.text()).not.toContain("Recommended");
});

test("an ID first used after the ban is marked new and is not ticked", async () => {
  const fresh = machineIdRow({ machineId: "ee55ff66", firstUsed: "2026-11-05T00:00:00.000Z", lastUsed: "2026-11-14T00:00:00.000Z", recommended: true });
  await mountPicker(initialPicker([...rows, fresh], ["aa11bb22"], "2026-11-01T00:00:00.000Z"));
  expect(rowOf("ee55ff66").text()).toContain("New since this ban");
  expect((rowOf("ee55ff66").find("input[type='checkbox']").element as HTMLInputElement).checked).toBe(false);
});

test("a labelled ID shows the data lane's note; IDs carry their full value and an include label", async () => {
  const labelled = machineIdRow({ machineId: "ee55ff66", lastUsed: "2026-11-14T00:00:00.000Z", recommended: false, shared: true });
  service.machineImpact.mockResolvedValue({ otherAccounts: 3, capped: false });
  await mountPicker(initialPicker([...rows, labelled]));
  expect(rowOf("ee55ff66").text()).toContain(txt("picker_shared"));
  expect(rowOf("aa11bb22").find("code").attributes("title")).toBe("aa11bb22");
  expect(rowOf("aa11bb22").find("input[type='checkbox']").attributes("aria-label")).toBe(txt("picker_include", { id: "aa11bb22" }));
});

test("the footer's collateral line is a warning", async () => {
  await mountPicker(initialPicker(rows));
  service.machineImpact.mockResolvedValue({ otherAccounts: 3, capped: false });
  await useBanDialogStore().loadImpact(["aa11bb22"]);
  await flushPromises();
  const footerText = wrapper.find(".picker-footer-text");
  expect(footerText.text()).toBe("1 of 2 selected · at least 3 other accounts use the selected IDs and will be locked out too");
  expect(footerText.classes()).toContain("text-warning");
});

test("ticking asks for the impact of the new selection; None asks for nothing", async () => {
  await mountPicker(initialPicker(rows));
  expect(service.machineImpact).toHaveBeenLastCalledWith("1001", ["aa11bb22"], "tok");
  await button("None").trigger("click");
  await wrapper.setProps({ modelValue: lastState() });
  await flushPromises();
  expect(lastState().ticked).toEqual([]);
  expect(service.machineImpact).toHaveBeenCalledTimes(1);
  await button("Recommended").trigger("click");
  expect(lastState().ticked).toEqual(["aa11bb22"]);
});

test("older IDs sit behind Show older", async () => {
  await mountPicker(initialPicker(rows));
  expect(rowOf("cc33dd44").exists()).toBe(false);
  await button("Show 1 older ID").trigger("click");
  await wrapper.setProps({ modelValue: lastState() });
  expect(rowOf("cc33dd44").exists()).toBe(true);
});

test("the other-accounts count opens the list, with links to their account view in a new tab", async () => {
  service.machineIdAccounts.mockResolvedValue({ total: 1, capped: false, accounts: [{ accountKey: "1002", currentBattleTag: "Тестер#1002", state: "neverBanned", ban: null }] });
  await mountPicker(initialPicker(rows));
  await button("2").trigger("click");
  await flushPromises();
  expect(service.machineIdAccounts).toHaveBeenCalledWith("aa11bb22", "1001", "tok");
  const link = wrapper.find("a.other-account");
  expect([link.text(), link.attributes("target"), link.attributes("href")]).toEqual(["Тестер#1002", "_blank", "/admin/admin-banned-players?account=1002"]);
  expect(link.attributes("rel")).toBe("noopener");
  expect(wrapper.text()).toContain("Never banned");
  await button("2").trigger("click");
  await button("2").trigger("click");
  await flushPromises();
  expect(service.machineIdAccounts).toHaveBeenCalledTimes(1);
});

test("a capped list of other accounts says how many are shown", async () => {
  service.machineIdAccounts.mockResolvedValue({
    total: 200,
    capped: true,
    accounts: [{ accountKey: "1002", currentBattleTag: "Тестер#1002", state: "bannedNow", ban: banSummary({ banId: "b2", gameModes: [], endDate: "2026-11-25T00:00:00.000Z" }) }],
  });
  await mountPicker(initialPicker(rows));
  await button("2").trigger("click");
  await flushPromises();
  expect(wrapper.text()).toContain("Banned now: Everything until 25 Nov");
  expect(wrapper.text()).toContain("First 1 of 200+");
});

test("Edit of a machine ban: changing only the IDs sends only the machine part", async () => {
  const ban = machineBanView({
    id: "ban1",
    accountKey: "1001",
    issuedAt: "2026-11-01T00:00:00.000Z",
    version: 3,
    machine: { machineIds: ["aa11bb22", "cc33dd44"], newMachineIdCount: 0, changes: [], version: 1 },
  });
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockResolvedValue(rows);
  service.machineImpact.mockResolvedValue({ otherAccounts: 0, capped: false });
  service.edit.mockResolvedValue(ban);
  openEdit(ban);
  await flushPromises();
  expect(wrapper.find(".ban-field-type").exists()).toBe(false);
  expect(wrapper.find(".ban-field-modes").exists()).toBe(false);
  expect(saveButton().element.disabled).toBe(true);
  await tick("cc33dd44");
  await save();
  await flushPromises();
  expect(service.edit).toHaveBeenCalledWith("ban1", { version: 3, machine: { version: 1, machineIds: ["aa11bb22"] } }, "tok");
});

test("Edit of a machine ban while machine data is unavailable still edits the other fields", async () => {
  const logged = expectMachineLoadLogged();
  const ban = machineBanView({ id: "ban1", accountKey: "1001", version: 1 });
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  service.machineIds.mockRejectedValue(new BanApiError(503, "MACHINE_DATA_UNAVAILABLE", ""));
  service.edit.mockResolvedValue(ban);
  openEdit(ban);
  await flushPromises();
  expect(logged).toHaveBeenCalledExactlyOnceWith("Failed to load machine IDs:", expect.any(BanApiError));
  expect(wrapper.find(".machine-picker").exists()).toBe(false);
  expect(wrapper.text()).toContain("Machine data is not available right now");
  await reason().setValue("new");
  await save();
  await flushPromises();
  expect(service.edit).toHaveBeenCalledWith("ban1", { version: 1, banReason: "new" }, "tok");
});

test("a moderator editing a machine ban asks for no machine data", async () => {
  oauth.permissions = ["Moderation"];
  service.account.mockResolvedValue(accountView({ accountKey: "1001" }));
  openEdit(machineBanView({ id: "ban1" }));
  await flushPromises();
  expect(service.machineIds).not.toHaveBeenCalled();
  expect(wrapper.find(".machine-picker").exists()).toBe(false);
  expect(wrapper.find(".ban-field-modes").exists()).toBe(true);
});
