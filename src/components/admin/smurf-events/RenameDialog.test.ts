// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventOrigin } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { inlineDialog, manualEvent, testPlugins } from "./setup.testing";

const service = vi.hoisted(() => ({ rename: vi.fn(), list: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import RenameDialog from "./RenameDialog.vue";

let wrapper: VueWrapper;

function open(origin: SmurfEventOrigin = "manual"): void {
  wrapper = mount(RenameDialog, {
    props: { modelValue: true, event: manualEvent({ origin, name: "Auto name" }) },
    global: { plugins: testPlugins(), stubs: { VDialog: inlineDialog } },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => wrapper?.unmount());

function save(): DOMWrapper<HTMLButtonElement> {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === "Save name");
  if (!found) throw new Error("No Save button");
  return found;
}

const nameInput = () => wrapper.find("input");

test("the name is prefilled and Save stays disabled while it is unchanged", async () => {
  open();

  expect((nameInput().element as HTMLInputElement).value).toBe("Auto name");
  expect(save().element.disabled).toBe(true);

  await nameInput().setValue("  Auto name  ");
  expect(save().element.disabled).toBe(true);

  await nameInput().setValue("Sofia LAN");
  expect(save().element.disabled).toBe(false);
});

test.each(["detected", "historical", "manual", "carried-over"] as const)("a %s event can be renamed", async (origin) => {
  open(origin);
  service.rename.mockResolvedValue(manualEvent({ origin, name: "Sofia LAN" }));

  await nameInput().setValue("Sofia LAN");
  await wrapper.find("textarea").setValue("known venue");
  await save().trigger("click");
  await flushPromises();

  expect(service.rename).toHaveBeenCalledWith("tok", "ev1", { name: "Sofia LAN", reason: "known venue" });
  expect(wrapper.emitted("renamed")).toHaveLength(1);
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

test("an empty name and one that is too long cannot be saved, and say why", async () => {
  open();

  await nameInput().setValue("   ");
  expect(save().element.disabled).toBe(true);
  expect(wrapper.text()).toContain("Enter a name.");

  await nameInput().setValue("x".repeat(101));
  expect(save().element.disabled).toBe(true);
});

test("a failed rename keeps the dialog open and shows the server's text", async () => {
  open();
  service.rename.mockRejectedValue(new SmurfEventsApiError(404, "Event is gone", null));

  await nameInput().setValue("Sofia LAN");
  await save().trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Event is gone");
  expect(wrapper.emitted("renamed")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("Enter that confirms an IME composition does not save", async () => {
  open();
  service.rename.mockResolvedValue(manualEvent({ name: "Sofia LAN" }));

  await nameInput().setValue("Sofia LAN");
  await nameInput().trigger("keydown", { key: "Enter", isComposing: true });
  expect(service.rename).not.toHaveBeenCalled();

  await nameInput().trigger("keydown", { key: "Enter" });
  await flushPromises();
  expect(service.rename).toHaveBeenCalledTimes(1);
});

test("Enter in the name field saves when Save is enabled and does nothing when it is not", async () => {
  open();
  service.rename.mockResolvedValue(manualEvent({ name: "Sofia LAN" }));

  await nameInput().trigger("keydown.enter");
  expect(service.rename).not.toHaveBeenCalled();

  await nameInput().setValue("   ");
  await nameInput().trigger("keydown.enter");
  expect(service.rename).not.toHaveBeenCalled();

  await nameInput().setValue("Sofia LAN");
  await nameInput().trigger("keydown.enter");
  await flushPromises();
  expect(service.rename).toHaveBeenCalledTimes(1);
});

test("Escape closes the dialog", async () => {
  wrapper.unmount();
  wrapper = mount(RenameDialog, { attachTo: document.body, props: { modelValue: true, event: manualEvent({ name: "Auto name" }) }, global: { plugins: testPlugins() } });
  await flushPromises();

  document.querySelector(".v-overlay")?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await flushPromises();

  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});
