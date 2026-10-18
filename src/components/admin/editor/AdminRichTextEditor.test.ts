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
    expect(wrapper.find("iframe").attributes("srcdoc")).toContain(html);
  });

  it("applies formatting and chosen text colors through the shared toolbar", async () => {
    const wrapper = await openEditor("<p>Community Event</p>");
    editorOf(wrapper).commands.setTextSelection({ from: 1, to: 10 });
    await wrapper.find('button[aria-label="Bold"]').trigger("click");
    await wrapper.find('input[type="color"]').setValue("#ff0000");
    await flushPromises();
    const result = document.createElement("div");
    result.innerHTML = String(wrapper.props("modelValue"));
    expect(result.querySelector("strong")?.textContent).toBe("Community");
    expect(result.querySelector("span")?.style.color).toBe("rgb(255, 0, 0)");
  });

  it("keeps unsupported HTML untouched and disables the lossy Visual switch", async () => {
    const html = '<table><tr><td style="font-family: monospace">Custom layout</td></tr></table>';
    const wrapper = await openEditor(html);
    expect(wrapper.find("textarea").element.value).toBe(html);
    expect(wrapper.findAll("button").find((button) => button.text() === "Visual")!.attributes("disabled")).toBeDefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
    expect(wrapper.find("iframe").attributes("srcdoc")).toContain(html);
  });

  it("updates when the parent loads another announcement or clears the draft", async () => {
    const wrapper = await openEditor("<p>First</p>");
    await wrapper.setProps({ modelValue: "<h3>Second</h3>" });
    expect(editorOf(wrapper).getHTML()).toBe("<h3>Second</h3>");
    expect(wrapper.find<HTMLInputElement>('input[type="color"]').element.value).toBe("#ffd428");
    await wrapper.setProps({ modelValue: "" });
    expect(editorOf(wrapper).isEmpty).toBe(true);
    expect(wrapper.find<HTMLInputElement>('input[type="color"]').element.value).toBe("#ffffff");
  });
});
