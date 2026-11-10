// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
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
