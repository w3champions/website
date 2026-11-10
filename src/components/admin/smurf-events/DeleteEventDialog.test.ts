// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { inlineDialog, manualEvent, testPlugins } from "./testing";

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
