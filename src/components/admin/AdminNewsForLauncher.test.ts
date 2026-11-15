// @vitest-environment jsdom
/* eslint-disable @stylistic/quotes -- Component templates contain quoted attributes. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import AdminNewsForLauncher from "./AdminNewsForLauncher.vue";

const mocks = vi.hoisted(() => ({ news: [{ message: "<p>Original news</p>", date: "Community Event", bsonId: "example-news" }], load: vi.fn(), save: vi.fn() }));
vi.mock("@/store/admin/infoMessages/store", () => ({ useInfoMessagesStore: () => ({ news: mocks.news, loadNews: mocks.load, editNews: mocks.save }) }));
const container = { template: "<div><slot /></div>" };
async function editNews() {
  const wrapper = mount(AdminNewsForLauncher, {
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        VCardTitle: container,
        VCardText: container,
        VCardActions: container,
        VCard: container,
        VSpacer: true,
        VTextField: true,
        VDataTable: { template: '<div><slot name="top" /><slot name="item.actions" :item="items[0]" /></div>', props: { items: { type: Array, default: () => [] } } },
        VDialog: { props: { modelValue: Boolean }, template: '<div v-if="modelValue"><slot /></div>' },
        VBtn: { template: "<button><slot /></button>" },
        VIcon: { template: '<button class="row-action"><slot /></button>' },
        AdminRichTextEditor: { props: { modelValue: { type: String, default: "" }, label: { type: String, default: "Announcement" } }, emits: ["update:modelValue"], template: `<textarea :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />` },
      },
    },
  });
  await flushPromises();
  await wrapper.find(".row-action").trigger("click");
  return wrapper;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.load.mockResolvedValue(undefined);
  mocks.save.mockResolvedValue(true);
});

describe("News shared editor integration", () => {
  it("saves the editor's HTML and converts plain URLs into links", async () => {
    const wrapper = await editNews();
    await wrapper.find("textarea").setValue("<h3>Join today</h3>https://example.com/event");
    expect(mocks.news[0].message).toBe("<p>Original news</p>");
    await wrapper.findAll("button").find((button) => button.text() === "views_admin.save")!.trigger("click");
    await flushPromises();
    expect(mocks.save).toHaveBeenCalledWith({ message: '<h3>Join today</h3><a href="https://example.com/event">https://example.com/event</a>', date: "Community Event", bsonId: "example-news" });
    wrapper.unmount();
  });

  it("discards the draft when cancelling without modifying the displayed news", async () => {
    const wrapper = await editNews();
    await wrapper.find("textarea").setValue("<p>Unsaved changes</p>");
    await wrapper.findAll("button").find((button) => button.text() === "views_admin.cancel")!.trigger("click");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.news[0].message).toBe("<p>Original news</p>");
    expect(wrapper.find("textarea").exists()).toBe(false);
    wrapper.unmount();
  });
});
