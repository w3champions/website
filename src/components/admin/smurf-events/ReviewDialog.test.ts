// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import type { SmurfEventDenyPreview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import { inlineDialog, manualEvent, testPlugins } from "./setup.testing";

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

function mountWith(event: ReturnType<typeof manualEvent>): void {
  wrapper.unmount();
  wrapper = mount(ReviewDialog, {
    props: { modelValue: true, event },
    global: { plugins: testPlugins(), stubs: { VDialog: inlineDialog } },
  });
}

const nameField = () => wrapper.find("input");

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

  pending.resolve({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }, { a: "Anchor#1002", b: "Guest#1003", source: "account" }], endedLinks: 2 });
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

test("clicking the chosen decision again clears it, and nothing can be saved", async () => {
  await button("Confirm").trigger("click");
  await button("Confirm").trigger("click");

  expect(button("Confirm").attributes("aria-pressed")).toBe("false");
  expect(button("Save review").element.disabled).toBe(true);

  await button("Save review").trigger("click");
  await flushPromises();
  expect(service.review).not.toHaveBeenCalled();
});

test("a failed review keeps the dialog open, shows the server's text and reports nothing", async () => {
  service.review.mockRejectedValue(new SmurfEventsApiError(409, "Changed meanwhile", null));

  await button("Confirm").trigger("click");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Changed meanwhile");
  expect(wrapper.emitted("reviewed")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  expect(button("Save review").element.disabled).toBe(false);
});

test("the dialog keeps the event it was opened for when the page's event goes away mid-write, then closes", async () => {
  const pending = deferred<ReturnType<typeof manualEvent>>();
  service.review.mockReturnValue(pending.promise);
  await button("Confirm").trigger("click");
  await button("Save review").trigger("click");

  await wrapper.setProps({ event: null });
  expect(wrapper.text()).toContain("Review LAN party");
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();

  pending.resolve(manualEvent({ review: "confirmed" }));
  await flushPromises();
  expect(wrapper.emitted("reviewed")).toHaveLength(1);
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

test("a review answered applied: false reports it", async () => {
  service.review.mockResolvedValue({ ...manualEvent({ review: "confirmed" }), applied: false });

  await button("Confirm").trigger("click");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("reviewed")?.[0]).toEqual([false, true]);
});

test("the decision buttons tell which decision is chosen", async () => {
  expect(wrapper.find("[role='group']").attributes("aria-label")).toBe("Decision");
  expect(button("Confirm").attributes("aria-pressed")).toBe("false");

  await button("Confirm").trigger("click");

  expect(button("Confirm").attributes("aria-pressed")).toBe("true");
  expect(button("Deny").attributes("aria-pressed")).toBe("false");
});

test("one link a deny brings back reads in the singular", async () => {
  service.denyPreview.mockResolvedValue({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }] });

  await button("Deny").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Denying brings back 1 link");
  expect(wrapper.text()).not.toContain("1 links");
});

const TRUNCATED_NOTE = "Showing part of the links a deny may bring back.";

test("a cut deny preview says so and counts the ended links, not the list", async () => {
  service.denyPreview.mockResolvedValue({
    links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }, { a: "Anchor#1002", b: "Guest#1003", source: "account" }],
    endedLinks: 7,
    linksTruncated: true,
  });

  await button("Deny").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain(TRUNCATED_NOTE);
  expect(wrapper.text()).toContain("A deny checks every link the event ended.");
  expect(wrapper.text()).toContain("The event ended 7 links");
  expect(wrapper.text()).not.toContain("Denying brings back");
  expect(wrapper.text()).toContain("Anchor#1001");
});

test("a cut deny preview with one ended link reads in the singular", async () => {
  service.denyPreview.mockResolvedValue({ links: [], endedLinks: 1, linksTruncated: true });

  await button("Deny").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The event ended 1 link");
  expect(wrapper.text()).not.toContain("1 links");
  expect(wrapper.text()).not.toContain("No links come back.");
});

test("a whole deny preview shows no cut note and counts its list", async () => {
  service.denyPreview.mockResolvedValue({ links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }], endedLinks: 1 });

  await button("Deny").trigger("click");
  await flushPromises();

  expect(wrapper.text()).not.toContain(TRUNCATED_NOTE);
  expect(wrapper.text()).toContain("Denying brings back 1 link");
});

test("a busy server on a review says so calmly, keeps the dialog open and the reason, and allows a retry", async () => {
  service.review.mockRejectedValueOnce(new SmurfEventsApiError(429, "Too many at once", null)).mockResolvedValueOnce(manualEvent({ review: "confirmed" }));

  await button("Confirm").trigger("click");
  await wrapper.find("textarea").setValue("known LAN");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The server is busy right now. Nothing was saved. Try again in a moment.");
  expect(wrapper.emitted("reviewed")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  expect((wrapper.find("textarea").element as HTMLTextAreaElement).value).toBe("known LAN");

  await button("Save review").trigger("click");
  await flushPromises();
  expect(wrapper.emitted("reviewed")).toHaveLength(1);
});

test("a deny preview answered applies: false carries one calm notice; true or absent carries none", async () => {
  service.denyPreview.mockResolvedValue({ applies: false, links: [{ a: "Anchor#1001", b: "Guest#1003", source: "hardware" }], endedLinks: 1 });
  await button("Deny").trigger("click");
  await flushPromises();
  const notice = "Smurf events do not change links at the moment. The links listed here are what this event ends, or brings back, once they do.";
  expect(wrapper.text()).toContain(notice);
  expect(wrapper.text().split(notice)).toHaveLength(2);

  service.denyPreview.mockResolvedValue({ applies: true, links: [], endedLinks: 0 });
  await button("Confirm").trigger("click");
  await button("Deny").trigger("click");
  await flushPromises();
  expect(wrapper.text()).not.toContain("do not change links");
});

test("a review answered applies: false reports it", async () => {
  service.review.mockResolvedValue({ ...manualEvent({ review: "confirmed" }), applies: false });

  await button("Confirm").trigger("click");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(wrapper.emitted("reviewed")?.[0]).toEqual([true, false]);
});

test("a busy review that carries a wait says how long to wait", async () => {
  service.review.mockRejectedValueOnce(new SmurfEventsApiError(429, null, null, 12));

  await button("Confirm").trigger("click");
  await wrapper.find("textarea").setValue("known LAN");
  await button("Save review").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("The server is busy right now. Nothing was saved. Try again in 12 seconds.");
});

test("the name field is prefilled with the event's name", () => {
  expect((nameField().element as HTMLInputElement).value).toBe("LAN party");
});

test("confirming a not yet named event needs a name that differs from the generated one", async () => {
  mountWith(manualEvent({ named: false, name: "Generated name" }));
  service.review.mockResolvedValue(manualEvent({ review: "confirmed" }));

  await button("Confirm").trigger("click");
  expect(button("Save review").element.disabled).toBe(true);
  expect(wrapper.text()).toContain("Name (required to confirm)");

  await nameField().setValue("Sofia LAN");
  expect(button("Save review").element.disabled).toBe(false);
  await button("Save review").trigger("click");
  await flushPromises();

  expect(service.review).toHaveBeenCalledWith("tok", "ev1", { decision: "confirmed", name: "Sofia LAN" });
});

test("denying a not yet named event accepts the generated name and sends none", async () => {
  mountWith(manualEvent({ named: false, name: "Generated name" }));
  service.denyPreview.mockResolvedValue({ links: [], endedLinks: 0 });
  service.review.mockResolvedValue(manualEvent({ review: "denied" }));

  await button("Deny").trigger("click");
  await flushPromises();
  await wrapper.find("textarea").setValue("not an event");

  expect(button("Save review").element.disabled).toBe(false);
  await button("Save review").trigger("click");
  await flushPromises();

  expect(service.review).toHaveBeenCalledWith("tok", "ev1", { decision: "denied", reason: "not an event" });
});

test("going back to unreviewed accepts the generated name", async () => {
  mountWith(manualEvent({ named: false, name: "Generated name", review: "confirmed" }));
  service.review.mockResolvedValue(manualEvent({ review: "unreviewed" }));

  await button("Back to unreviewed").trigger("click");

  expect(button("Save review").element.disabled).toBe(false);
});

test("an already named event is confirmed without a name, and a changed name is sent", async () => {
  service.review.mockResolvedValue(manualEvent({ review: "confirmed" }));

  await button("Confirm").trigger("click");
  await nameField().setValue("  LAN party  ");
  await button("Save review").trigger("click");
  await flushPromises();
  expect(service.review).toHaveBeenLastCalledWith("tok", "ev1", { decision: "confirmed" });

  await nameField().setValue("Renamed LAN");
  await button("Save review").trigger("click");
  await flushPromises();
  expect(service.review).toHaveBeenLastCalledWith("tok", "ev1", { decision: "confirmed", name: "Renamed LAN" });
});

test("an empty or too long name cannot be saved", async () => {
  await button("Confirm").trigger("click");

  await nameField().setValue("  ");
  expect(button("Save review").element.disabled).toBe(true);
  await nameField().setValue("x".repeat(101));
  expect(button("Save review").element.disabled).toBe(true);
});

test("the decision buttons use no success or error colour and the body names no verdict", () => {
  const html = wrapper.find("[role='group']").html();

  expect(html).not.toMatch(/success|error/);
  expect(wrapper.text()).not.toContain("real event");
});
