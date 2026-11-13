// @vitest-environment jsdom
/* eslint-disable @stylistic/quotes -- HTML fixtures contain quoted attributes. */
import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { EditorContent } from "@tiptap/vue-3";
import type { Editor } from "@tiptap/core";
import AdminRichTextEditor from "./AdminRichTextEditor.vue";

const container = { template: "<div><slot /></div>" };
const wrappers: VueWrapper[] = [];
async function openEditor(modelValue: string) {
  const wrapper: VueWrapper<InstanceType<typeof AdminRichTextEditor>> = mount(AdminRichTextEditor, {
    props: { modelValue, "onUpdate:modelValue": (html: string) => void wrapper.setProps({ modelValue: html }) },
    global: {
      stubs: {
        VInput: container,
        VMenu: { template: '<div><slot name="activator" :props="{}" /><slot /></div>' },
        VCard: container,
        VCardActions: container,
        VColorPicker: { name: "VColorPicker", props: { modelValue: { type: String, default: "" } }, emits: ["update:modelValue"], template: "<div />" },
        VAlert: container,
        VBtn: { props: { disabled: Boolean }, template: '<button :disabled="disabled"><slot /></button>' },
        VDialog: { props: { modelValue: Boolean }, template: '<div v-if="modelValue"><slot /></div>' },
      },
    },
  });
  wrappers.push(wrapper);
  await flushPromises();
  return wrapper;
}
function editorOf(wrapper: VueWrapper): Editor {
  return wrapper.findComponent(EditorContent).props("editor") as Editor;
}
async function mode(wrapper: VueWrapper, value: "HTML" | "Visual") {
  await wrapper.findAll("button").find((button) => button.text() === value)!.trigger("click");
  await flushPromises();
}
afterEach(() => {
  wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
});

describe("shared announcement editor", () => {
  it("uses Tiptap's Link extension to convert a typed URL after whitespace", async () => {
    const wrapper = await openEditor("<p></p>");
    editorOf(wrapper).commands.insertContent("https://example.com/typed ");
    await flushPromises();
    const result = document.createElement("div");
    result.innerHTML = editorOf(wrapper).getHTML();
    expect(result.querySelector("a")?.getAttribute("href")).toBe("https://example.com/typed");
  });

  it("uses Tiptap's native paste handling for URLs pasted into Visual mode", async () => {
    const wrapper = await openEditor("<p></p>");
    editorOf(wrapper).view.pasteText("Visit https://example.com/pasted.", new Event("paste") as ClipboardEvent);
    await flushPromises();
    const result = document.createElement("div");
    result.innerHTML = editorOf(wrapper).getHTML();
    expect(result.querySelector("a")?.getAttribute("href")).toBe("https://example.com/pasted");
    expect(result.textContent).toBe("Visit https://example.com/pasted.");
  });

  it("shows plain URLs as links when loading content and switching from HTML to Visual", async () => {
    const wrapper = await openEditor("<p>Visit https://example.com/loaded</p>");
    expect(wrapper.find('[role="textbox"] a').attributes("href")).toBe("https://example.com/loaded");
    await mode(wrapper, "HTML");
    expect(wrapper.find("textarea").element.value).toContain('href="https://example.com/loaded"');
    await wrapper.find("textarea").setValue("<p><strong>Visit</strong> https://example.com/source</p>");
    await mode(wrapper, "Visual");
    expect(wrapper.find('[role="textbox"] a').attributes("href")).toBe("https://example.com/source");
    expect(wrapper.find('[role="textbox"] strong').text()).toBe("Visit");
    expect(wrapper.props("modelValue")).toContain('href="https://example.com/source"');
    await wrapper.setProps({ modelValue: "<p>https://example.com/reloaded</p>" });
    expect(wrapper.find('[role="textbox"] a').attributes("href")).toBe("https://example.com/reloaded");
  });

  it("allows removing an automatic link without the model watcher restoring it", async () => {
    const wrapper = await openEditor("<p>https://example.com/removable</p>");
    editorOf(wrapper).commands.setTextSelection(2);
    editorOf(wrapper).commands.unsetLink();
    await flushPromises();
    expect(wrapper.find('[role="textbox"] a').exists()).toBe(false);
    expect(wrapper.props("modelValue")).not.toContain("<a");
  });

  it("round trips between HTML and Visual with heading color, margins and line breaks", async () => {
    const wrapper = await openEditor('<h3 style="color: #ffd428; margin: 0 0 10px">Community Event</h3><div>One<br>Two</div>');
    await mode(wrapper, "HTML");
    await mode(wrapper, "Visual");
    const html = String(wrapper.props("modelValue"));
    const result = document.createElement("div");
    result.innerHTML = html;
    expect(result.querySelector("h3")?.style.color).toBe("rgb(255, 212, 40)");
    expect(result.querySelector("h3")?.style.margin).toBe("0px 0px 10px");
    expect(result.querySelector("br")).not.toBeNull();
    expect(wrapper.find("iframe").exists()).toBe(false);
  });

  it("applies formatting and chosen text colors through the shared toolbar", async () => {
    const wrapper = await openEditor("<p>Community Event</p>");
    editorOf(wrapper).commands.setTextSelection({ from: 1, to: 10 });
    await wrapper.find('button[aria-label="Bold"]').trigger("click");
    wrapper.findComponent({ name: "VColorPicker" }).vm.$emit("update:modelValue", "#ff0000");
    await flushPromises();
    const result = document.createElement("div");
    result.innerHTML = String(wrapper.props("modelValue"));
    expect(result.querySelector("strong")?.textContent).toBe("Community");
    expect(result.querySelector("span")?.style.color).toBe("rgb(255, 0, 0)");
  });

  it("resets a selected color through the picker", async () => {
    const wrapper = await openEditor('<h3 style="color: #ff0000">Community Event</h3>');
    editorOf(wrapper).commands.setTextSelection({ from: 1, to: 10 });
    await wrapper.find('button[aria-label="Reset text color"]').trigger("click");
    expect(editorOf(wrapper).getHTML()).not.toContain("color:");
    expect(wrapper.findComponent({ name: "VColorPicker" }).props("modelValue")).toBe("#ffd428");
    expect(wrapper.find('button[aria-label="Text color"] .announcement-editor__swatch').attributes("style")).toContain("background-color: rgb(255, 212, 40)");
  });

  it("keeps unsupported HTML untouched and disables the lossy Visual switch", async () => {
    const html = '<table><tr><td style="font-family: monospace">Custom layout</td></tr></table>';
    const wrapper = await openEditor(html);
    expect(wrapper.find("textarea").element.value).toBe(html);
    expect(wrapper.findAll("button").find((button) => button.text() === "Visual")!.attributes("disabled")).toBeDefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.find("iframe").exists()).toBe(false);
  });

  it("updates when the parent loads another announcement or clears the draft", async () => {
    const wrapper = await openEditor("<p>First</p>");
    await wrapper.setProps({ modelValue: "<h3>Second</h3>" });
    expect(editorOf(wrapper).getHTML()).toBe("<h3>Second</h3>");
    expect(wrapper.findComponent({ name: "VColorPicker" }).props("modelValue")).toBe("#ffd428");
    await wrapper.setProps({ modelValue: "" });
    expect(editorOf(wrapper).isEmpty).toBe(true);
    expect(wrapper.findComponent({ name: "VColorPicker" }).props("modelValue")).toBe("#ffffff");
  });
});
