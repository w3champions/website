// @vitest-environment jsdom
/* eslint-disable vue/one-component-per-file -- Component stubs for the editor test. */
/* eslint-disable @stylistic/quotes -- HTML fixtures and component templates contain quoted attributes. */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { defineComponent, onMounted, type PropType } from "vue";
import AdminMotd from "./AdminMotd.vue";

const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), validate: vi.fn() }));
vi.mock("@/store/admin/infoMessages/store", () => ({
  useInfoMessagesStore: () => ({ messageOfTheDay: { motd: "Current announcement" }, loadMotd: mocks.load, setMotd: mocks.save }),
}));

const container = { template: "<div><slot /></div>" };
const textarea = defineComponent({
  props: { modelValue: { type: String, required: true }, rules: { type: Array as PropType<Array<(value?: string) => true | string>>, required: true } },
  emits: ["update:modelValue"],
  template: `<textarea :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
});
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
        VTextarea: textarea,
        VBtn: { props: { disabled: Boolean }, template: `<button :disabled="disabled"><slot /></button>` },
      },
    },
  });
  await flushPromises();
  return wrapper;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.load.mockResolvedValue(true);
  mocks.save.mockResolvedValue(true);
  mocks.validate.mockResolvedValue({ valid: true });
});

describe("MOTD editor", () => {
  it("previews the generated links and formatting live without allowing scripts", async () => {
    const wrapper = await openEditor();
    const preview = wrapper.find("iframe");
    expect(preview.attributes("sandbox")).toBe("");
    expect(preview.attributes("srcdoc")).toContain("Current announcement");
    await wrapper.find("textarea").setValue("<strong>Join today</strong>: https://challonge.com/DLEEQualifier");
    expect(preview.attributes("srcdoc")).toContain(`<strong>Join today</strong>: <a href="https://challonge.com/DLEEQualifier">https://challonge.com/DLEEQualifier</a>`);
    expect(preview.attributes("srcdoc")).toContain("default-src 'none'");
    expect(mocks.save).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("saves plain URLs as anchors and keeps existing formatted content", async () => {
    const wrapper = await openEditor();
    await wrapper.find("textarea").setValue("<strong>Join today</strong>: https://challonge.com/DLEEQualifier");
    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(mocks.save).toHaveBeenCalledWith({ motd: `<strong>Join today</strong>: <a href="https://challonge.com/DLEEQualifier">https://challonge.com/DLEEQualifier</a>` });
    wrapper.unmount();
  });

  it("validates the generated HTML length and does not save an invalid message", async () => {
    const wrapper = await openEditor();
    const input = `${"a".repeat(1965)} https://example.com`;
    expect(input.length).toBeLessThan(2000);
    await wrapper.find("textarea").setValue(input);
    const [validateLength] = wrapper.findComponent(textarea).props("rules")!;
    expect(validateLength(input)).toBe("Max 2000 characters, including generated links");
    mocks.validate.mockResolvedValue({ valid: false });
    await wrapper.find("button").trigger("click");
    await flushPromises();
    expect(mocks.save).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it("accepts the 2000-character boundary and rejects longer messages", async () => {
    const wrapper = await openEditor();
    await wrapper.find("textarea").setValue("a".repeat(2000));
    const [validateLength] = wrapper.findComponent(textarea).props("rules")!;
    expect(validateLength()).toBe(true);
    await wrapper.find("textarea").setValue("a".repeat(2001));
    expect(validateLength()).toBe("Max 2000 characters, including generated links");
    wrapper.unmount();
  });
});
