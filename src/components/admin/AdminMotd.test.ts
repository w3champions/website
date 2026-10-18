// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Component stubs for the editor test. */
/* eslint-disable @stylistic/quotes -- HTML fixtures and component templates contain quoted attributes. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { defineComponent, onMounted } from "vue";
import AdminMotd from "./AdminMotd.vue";
import AdminRichTextEditor from "./editor/AdminRichTextEditor.vue";

const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), validate: vi.fn() }));
vi.mock("@/store/admin/infoMessages/store", () => ({
  useInfoMessagesStore: () => ({ messageOfTheDay: { motd: "Current announcement" }, loadMotd: mocks.load, setMotd: mocks.save }),
}));

const container = { template: "<div><slot /></div>" };
const input = defineComponent({ name: "VInput", props: { modelValue: { type: String, default: "" }, rules: { type: Array, default: () => [] } }, template: "<div><slot /></div>" });
const form = defineComponent({
  emits: ["update:modelValue"],
  setup(_, { emit, expose }) {
    expose({ validate: mocks.validate });
    onMounted(() => emit("update:modelValue", true));
  },
  template: "<div><slot /></div>",
});

async function openEditor() {
  const wrapper = mount(AdminMotd, {
    global: {
      stubs: {
        VAlert: container,
        VCardTitle: container,
        VContainer: container,
        VCard: container,
        VCardText: container,
        VCardActions: container,
        VDivider: true,
        VForm: form,
        VInput: input,
        VDialog: { props: { modelValue: Boolean }, template: '<div v-if="modelValue"><slot /></div>' },
        VBtn: { props: { disabled: Boolean }, template: '<button :disabled="disabled"><slot /></button>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
}

async function setHtml(wrapper: VueWrapper, html: string) {
  await wrapper.findAll("button").find((button) => button.text() === "HTML")!.trigger("click");
  await wrapper.find("textarea").setValue(html);
}

async function save(wrapper: VueWrapper) {
  await wrapper.findAll("button").find((button) => button.text() === "Set New Motd")!.trigger("click");
  await flushPromises();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.load.mockResolvedValue(true);
  mocks.save.mockResolvedValue(true);
  mocks.validate.mockResolvedValue({ valid: true });
});

describe("MOTD editor", () => {
  it("edits formatting directly in Visual mode without a separate preview", async () => {
    const wrapper = await openEditor();
    expect(wrapper.find('[role="textbox"]').text()).toBe("Current announcement");
    expect(wrapper.find("iframe").exists()).toBe(false);
    await setHtml(wrapper, "<p><strong>Join today</strong></p>");
    await wrapper.findAll("button").find((button) => button.text() === "Visual")!.trigger("click");
    expect(wrapper.find('[role="textbox"] strong').text()).toBe("Join today");
    expect(mocks.save).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("saves plain URLs as anchors and keeps existing formatted content", async () => {
    const wrapper = await openEditor();
    await setHtml(wrapper, "<strong>Join today</strong>: https://example.com/events/qualifier");
    await save(wrapper);
    expect(mocks.save).toHaveBeenCalledWith({ motd: '<strong>Join today</strong>: <a href="https://example.com/events/qualifier">https://example.com/events/qualifier</a>' });
    wrapper.unmount();
  });

  it("validates the generated HTML length and does not save an invalid message", async () => {
    const wrapper = await openEditor();
    const html = `${"a".repeat(1965)} https://example.com`;
    expect(html.length).toBeLessThan(2000);
    await setHtml(wrapper, html);
    const rules = wrapper.findComponent(AdminRichTextEditor).findComponent(input).props("rules") as Array<() => true | string>;
    expect(rules[0]()).toBe("Max 2000 characters, including HTML and generated links");
    mocks.validate.mockResolvedValue({ valid: false });
    await save(wrapper);
    expect(mocks.save).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("accepts the 2000-character boundary and rejects longer messages", async () => {
    const wrapper = await openEditor();
    await setHtml(wrapper, "a".repeat(2000));
    const rules = wrapper.findComponent(AdminRichTextEditor).findComponent(input).props("rules") as Array<() => true | string>;
    expect(rules[0]()).toBe(true);
    await wrapper.find("textarea").setValue("a".repeat(2001));
    expect(rules[0]()).toBe("Max 2000 characters, including HTML and generated links");
    wrapper.unmount();
  });
});
