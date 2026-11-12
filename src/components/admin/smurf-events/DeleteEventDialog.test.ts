// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { SmurfEventsApiError } from "@/services/admin/SmurfEventsService";
import { inlineDialog, manualEvent, testPlugins } from "./setup.testing";

const service = vi.hoisted(() => ({ remove: vi.fn(), list: vi.fn() }));
vi.mock("@/store/admin/smurfEvents/service", () => ({ smurfEventsService: () => service }));
vi.mock("@/store/oauth/store", () => ({ useOauthStore: () => ({ token: "tok" }) }));

import DeleteEventDialog from "./DeleteEventDialog.vue";

let wrapper: VueWrapper;

beforeEach(() => {
  vi.resetAllMocks();
  service.list.mockResolvedValue({ events: [] });
  service.remove.mockResolvedValue(undefined);
  wrapper = mount(DeleteEventDialog, {
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

test("Delete stays disabled until a reason is entered, then sends it", async () => {
  expect(button("Delete event").element.disabled).toBe(true);

  await wrapper.find("textarea").setValue("  duplicate of another event  ");
  expect(button("Delete event").element.disabled).toBe(false);
  await button("Delete event").trigger("click");
  await flushPromises();

  expect(service.remove).toHaveBeenCalledWith("tok", "ev1", "duplicate of another event");
  expect(wrapper.emitted("deleted")).toHaveLength(1);
});

test("the dialog keeps the event it was opened for when the page's event goes away mid-write, then closes", async () => {
  let finish!: () => void;
  service.remove.mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  await wrapper.find("textarea").setValue("duplicate");
  await button("Delete event").trigger("click");

  await wrapper.setProps({ event: null });
  expect(wrapper.text()).toContain("Delete LAN party");
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();

  finish();
  await flushPromises();
  expect(wrapper.emitted("deleted")).toHaveLength(1);
  expect(wrapper.emitted("update:modelValue")?.at(-1)).toEqual([false]);
});

test("a failed delete keeps the dialog open, shows the server's text and reports nothing", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  service.remove.mockRejectedValue(new SmurfEventsApiError(409, "Only manual events can be deleted", null));
  await wrapper.find("textarea").setValue("duplicate");

  await button("Delete event").trigger("click");
  await flushPromises();

  expect(wrapper.text()).toContain("Only manual events can be deleted");
  expect(wrapper.emitted("deleted")).toBeUndefined();
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  expect(button("Delete event").element.disabled).toBe(false);
});
