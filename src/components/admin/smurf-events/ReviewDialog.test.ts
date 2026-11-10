// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventDenyPreview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { inlineDialog, manualEvent, testPlugins } from "./testing";

const service = vi.hoisted(() => ({ denyPreview: vi.fn(), review: vi.fn(), list: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import ReviewDialog from "./ReviewDialog.vue";

let wrapper: VueWrapper;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => (resolve = res));
  return { promise, resolve };
}

beforeEach(() => {
  vi.resetAllMocks();
  service.list.mockResolvedValue({ events: [] });
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  wrapper = mount(ReviewDialog, {
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

test("choosing deny lists the links it would bring back before it can be saved", async () => {
  const pending = deferred<SmurfEventDenyPreview>();
  service.denyPreview.mockReturnValue(pending.promise);
  service.review.mockResolvedValue(manualEvent({ review: "denied" }));

  await button("Deny").trigger("click");
  expect(service.denyPreview).toHaveBeenCalledWith("tok", "ev1");
  expect(button("Save review").element.disabled).toBe(true);

  pending.resolve({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }, { a: "Anchor#1002", b: "Guest#1003", source: "account" }] });
  await flushPromises();

  expect(wrapper.text()).toContain("Denying brings back 2 links");
  expect(wrapper.text()).toContain("Anchor#1001");
  expect(wrapper.text()).toContain("Anchor#1002");
  expect(button("Save review").element.disabled).toBe(true);

  await wrapper.find("textarea").setValue("not an event");
  expect(button("Save review").element.disabled).toBe(false);
  await button("Save review").trigger("click");
  await flushPromises();

  expect(service.review).toHaveBeenCalledWith("tok", "ev1", { decision: "denied", reason: "not an event" });
  expect(wrapper.emitted("reviewed")).toHaveLength(1);
});

test("a deny that brings nothing back says so", async () => {
  service.denyPreview.mockResolvedValue({ links: [] });

  await button("Deny").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("No links come back.");
});

test("Save stays disabled for a deny until a reason is entered", async () => {
  service.denyPreview.mockResolvedValue({ links: [] });
  await button("Deny").trigger("click");
  await flushPromises();

  expect(button("Save review").element.disabled).toBe(true);
  await wrapper.find("textarea").setValue("   ");
  expect(button("Save review").element.disabled).toBe(true);
  await wrapper.find("textarea").setValue("same household, not an event");
  expect(button("Save review").element.disabled).toBe(false);
});

test("confirming needs no deny preview", async () => {
  service.review.mockResolvedValue(manualEvent({ review: "confirmed" }));

  await button("Confirm").trigger("click");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(service.denyPreview).not.toHaveBeenCalled();
  expect(service.review).toHaveBeenCalledWith("tok", "ev1", { decision: "confirmed" });
});
