// @vitest-environment jsdom
import { afterEach, expect, test, vi } from "vitest";
import { mount, type VueWrapper } from "@vue/test-utils";
import { VTooltip } from "vuetify/components";
import type { SmurfEventOrigin, SmurfEventReview } from "@/services/admin/smurf-detection/SmurfEventsResponse";
import { testPlugins } from "./setup.testing";
import EventBadge from "./EventBadge.vue";

let wrapper: VueWrapper;

afterEach(() => wrapper.unmount());

function show(kind: "origin" | "review", value: SmurfEventOrigin | SmurfEventReview): void {
  wrapper = mount(EventBadge, { props: { kind, value }, global: { plugins: testPlugins() } });
}

test.each(
  [
    ["detected", "Detected", "Found by the server."],
    ["historical", "Historical", "Found by the server when looking back over past data."],
    ["manual", "Manual", "Entered by a moderator."],
    ["carried-over", "Carried over", "Carried over from the previous list of events."],
  ] as const,
)("the %s origin shows its label and explains itself in a tooltip", (origin, label, hint) => {
  show("origin", origin);

  expect(wrapper.text()).toBe(label);
  expect(wrapper.findComponent(VTooltip).props("text")).toBe(hint);
});

test("an origin the page does not know shows as sent, explains itself with the same text and logs nothing", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

  show("origin", "future" as SmurfEventOrigin);

  expect(wrapper.text()).toBe("future");
  expect(wrapper.findComponent(VTooltip).props("text")).toBe("future");
  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test("the chip can be reached with the keyboard so that the tooltip opens", () => {
  show("origin", "manual");

  expect(wrapper.find(".v-chip").attributes("tabindex")).toBe("0");
});

test.each([["unreviewed", "Unreviewed", "warning"], ["confirmed", "Confirmed", "primary"], ["denied", "Denied", "grey"]] as const)("the %s review shows its label in a calm colour", (review, label, color) => {
  show("review", review);

  expect(wrapper.text()).toContain(label);
  expect(wrapper.find(".v-chip").classes().join(" ")).toContain(color);
  expect(wrapper.findComponent(VTooltip).exists()).toBe(false);
});

test("the orange of an unreviewed event comes with the diamond mark, and no other review carries it", () => {
  show("review", "unreviewed");
  expect(wrapper.text()).toContain("\u25C6");
  expect(wrapper.find(".v-chip").classes().join(" ")).toContain("warning");
  wrapper.unmount();

  show("review", "confirmed");
  expect(wrapper.text()).not.toContain("\u25C6");
});
