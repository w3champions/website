// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import type { SmurfEventPreview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { inlineDialog, manualEvent, testPlugins } from "./setup.testing";

const service = vi.hoisted(() => ({ preview: vi.fn(), create: vi.fn(), update: vi.fn(), list: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import ManualEventDialog from "./ManualEventDialog.vue";

const PREVIEW: SmurfEventPreview = {
  span: { from: "2026-10-01T06:00:00.000Z", to: "2026-10-02T22:00:00.000Z" },
  networks: [{ hash8: "0a1b2c3d", anchors: 2, firstAt: "2026-10-01T06:00:00.000Z", lastAt: "2026-10-02T22:00:00.000Z" }],
  excluded: [{ hash8: "11223344", reason: "home" }],
  counts: { machines: 3, attendees: 3 },
  endsLinks: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }],
};

let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  service.preview.mockResolvedValue(PREVIEW);
  service.list.mockResolvedValue({ events: [] });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  wrapper = mount(ManualEventDialog, {
    props: { modelValue: true, event: manualEvent() },
    global: { plugins: testPlugins(), stubs: { VDialog: inlineDialog } },
  });
});

afterEach(() => wrapper.unmount());

function button(label: string): DOMWrapper<HTMLButtonElement> {
  const found = wrapper.findAll("button").find((b) => b.text().trim() === label);
  if (!found) throw new Error(`No button "${label}"`);
  return found;
}

test("Save stays disabled until a preview of the current draft succeeds", async () => {
  expect(button("Save").element.disabled).toBe(true);

  await button("Preview").trigger("click");
  await flushPromises();

  expect(service.preview).toHaveBeenCalledWith("tok", {
    name: "LAN party",
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-03T00:00:00.000Z",
    anchors: ["Anchor#1001", "Anchor#1002"],
    replacing: "ev1",
  });
  expect(wrapper.text()).toContain("0a1b2c3d");
  expect(button("Save").element.disabled).toBe(false);
});

test("changing the span after a preview disables Save until the next preview", async () => {
  await button("Preview").trigger("click");
  await flushPromises();

  await wrapper.findAll("input[type='datetime-local']")[1].setValue("2026-10-04T00:00");

  expect(button("Save").element.disabled).toBe(true);
  expect(wrapper.text()).toContain("The span or anchors changed since the preview.");
});

test("a refused preview shows the refusal and keeps Save disabled", async () => {
  service.preview.mockResolvedValue({ ...PREVIEW, refused: "too-wide" });

  await button("Preview").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("This location is too widely used to be an event venue.");
  expect(button("Save").element.disabled).toBe(true);
});

test("Save after a preview updates the event and reports it", async () => {
  service.update.mockResolvedValue(manualEvent({ name: "LAN party" }));
  await button("Preview").trigger("click");
  await flushPromises();

  await button("Save").trigger("click");
  await flushPromises();

  expect(service.update).toHaveBeenCalledWith("tok", "ev1", {
    name: "LAN party",
    from: "2026-10-01T00:00:00.000Z",
    to: "2026-10-03T00:00:00.000Z",
    anchors: ["Anchor#1001", "Anchor#1002"],
  });
  expect(wrapper.emitted("saved")?.[0]?.[0]).toMatchObject({ id: "ev1" });
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

async function previewed(): Promise<void> {
  await button("Preview").trigger("click");
  await flushPromises();
}

test("a failed save keeps the dialog open, shows the server's text and reports nothing", async () => {
  service.update.mockRejectedValue(new SmurfEventsApiError(400, "Name is too long", null));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Name is too long");
  expect(wrapper.emitted("saved")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});

test("a refusal without a usable preview disables Save until the next preview succeeds", async () => {
  service.update.mockRejectedValue(new SmurfEventsApiError(422, "Refused", { error: "Refused", preview: "none" }));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Refused");
  expect(button("Save").element.disabled).toBe(true);
  await previewed();
  expect(button("Save").element.disabled).toBe(false);
});

test("a refusal with a preview shows it and keeps Save disabled", async () => {
  const refused = { ...PREVIEW, refused: "no-venue" };
  service.update.mockRejectedValue(new SmurfEventsApiError(422, "Refused", { error: "Refused", preview: refused }));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("No shared location was found for these players in this span.");
  expect(button("Save").element.disabled).toBe(true);
});

test("a 503 on the preview or the save says the server is still preparing, not a generic failure", async () => {
  service.preview.mockRejectedValueOnce(new SmurfEventsApiError(503, "Index building", null));
  await previewed();
  expect(wrapper.text()).toContain("still preparing the data manual events need");
  expect(wrapper.text()).not.toContain("Index building");

  await previewed();
  service.update.mockRejectedValue(new SmurfEventsApiError(503, "Index building", null));
  await button("Save").trigger("click");
  await flushPromises();
  expect(wrapper.text()).toContain("Nothing was saved. Try again later.");
});

const BUSY = (): SmurfEventsApiError => new SmurfEventsApiError(429, "Busy", { error: "Busy" });

test("a busy server on the preview says so calmly and leaves the earlier preview and Save as they were", async () => {
  await previewed();
  service.preview.mockRejectedValueOnce(BUSY());

  await previewed();

  expect(wrapper.text()).toContain("The server is busy with another preview.");
  expect(wrapper.text()).not.toContain("Busy");
  expect(wrapper.text()).toContain("0a1b2c3d");
  expect(button("Save").element.disabled).toBe(false);
});

test("a busy server on the first preview leaves Save off and the input intact", async () => {
  service.preview.mockRejectedValueOnce(BUSY());

  await previewed();

  expect(wrapper.text()).toContain("The server is busy with another preview.");
  expect(button("Save").element.disabled).toBe(true);
  expect((wrapper.find("input").element as HTMLInputElement).value).toBe("LAN party");
  expect(button("Preview").element.disabled).toBe(false);
});

test("a busy server on an update keeps the dialog open, the preview and the input, and allows a retry", async () => {
  service.update.mockRejectedValueOnce(BUSY()).mockResolvedValueOnce(manualEvent());
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The server is busy with another preview.");
  expect(wrapper.emitted("saved")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  expect((wrapper.find("input").element as HTMLInputElement).value).toBe("LAN party");
  expect(button("Save").element.disabled).toBe(false);

  await button("Save").trigger("click");
  await flushPromises();
  expect(wrapper.emitted("saved")).toHaveLength(1);
});

test("a busy server on a create keeps the dialog open and the preview", async () => {
  service.create.mockRejectedValue(BUSY());
  await wrapper.setProps({ event: null });
  await wrapper.find("input").setValue("My new LAN");
  wrapper.findComponent({ name: "VCombobox" }).vm.$emit("update:modelValue", ["Anchor#1001", "Anchor#1002"]);
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(service.create).toHaveBeenCalledOnce();
  expect(wrapper.text()).toContain("The server is busy with another preview.");
  expect(wrapper.emitted("saved")).toBeUndefined();
  expect(button("Save").element.disabled).toBe(false);
});

test("the link count of the preview reads in the singular for one", async () => {
  await previewed();

  expect(wrapper.text()).toContain("Saving ends 1 link");
  expect(wrapper.text()).not.toContain("1 links");
});

test("a save answered applied: false reports it", async () => {
  service.update.mockResolvedValue({ ...manualEvent(), applied: false });
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("saved")?.[0]?.[1]).toEqual({ applied: false, existing: false, needsReview: false });
});

test("a create the server answered with an existing event reports it, whatever its name", async () => {
  await wrapper.setProps({ event: null });
  await wrapper.find("input").setValue("My new LAN");
  await wrapper.find("input[type='datetime-local']").setValue("2026-10-01T00:00");
  await wrapper.findAll("input[type='datetime-local']")[1].setValue("2026-10-03T00:00");
  wrapper.findComponent({ name: "VCombobox" }).vm.$emit("update:modelValue", ["Anchor#1001", "Anchor#1002"]);
  service.create.mockResolvedValue({ event: manualEvent({ name: "LAN party" }), existing: true });
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(service.create).toHaveBeenCalledOnce();
  expect(wrapper.emitted("saved")?.[0]?.[1]).toEqual({ applied: true, existing: true, needsReview: false });
});

test("an untouched new event dialog shows no problem until something is entered", async () => {
  await wrapper.setProps({ modelValue: false });
  await wrapper.setProps({ event: null, modelValue: true });
  expect(wrapper.text()).not.toContain("Enter a name.");

  await wrapper.find("input").setValue("My LAN");

  expect(wrapper.text()).toContain("anchor BattleTags.");
});

test("a create answered as new is not reported as existing, even when the saved name differs from the typed one", async () => {
  await wrapper.setProps({ event: null });
  await wrapper.find("input").setValue("  My new LAN  ");
  wrapper.findComponent({ name: "VCombobox" }).vm.$emit("update:modelValue", ["Anchor#1001", "Anchor#1002"]);
  service.create.mockResolvedValue({ event: manualEvent({ name: "Something else" }), existing: false });
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("saved")?.[0]?.[1]).toMatchObject({ existing: false });
});

test("an edit that takes a confirmed event back to unreviewed says it needs review", async () => {
  await wrapper.setProps({ event: manualEvent({ review: "confirmed" }) });
  service.update.mockResolvedValue(manualEvent({ review: "unreviewed" }));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("saved")?.[0]?.[1]).toMatchObject({ needsReview: true });
});

test("an edit that keeps the review does not", async () => {
  await wrapper.setProps({ event: manualEvent({ review: "confirmed" }) });
  service.update.mockResolvedValue(manualEvent({ review: "confirmed" }));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("saved")?.[0]?.[1]).toMatchObject({ needsReview: false });
});

test("a preview of an event that is gone or no longer manual shows the server's text in the preview error place", async () => {
  service.preview.mockRejectedValue(new SmurfEventsApiError(409, "Only manual events can be replaced", null));

  await button("Preview").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The preview couldn't be loaded: Only manual events can be replaced");
  expect(button("Save").element.disabled).toBe(true);
});

test("an edit that kept changing shows the server's text and keeps the dialog open with the input", async () => {
  service.update.mockRejectedValue(new SmurfEventsApiError(409, "The smurf event kept changing while the edit was resolved", null));
  await previewed();

  await button("Save").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The smurf event kept changing while the edit was resolved");
  expect(wrapper.emitted("saved")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  expect((wrapper.find("input").element as HTMLInputElement).value).toBe("LAN party");
});
