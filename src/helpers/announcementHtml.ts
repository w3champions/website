import { Editor, type JSONContent } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import TextExtension from "@tiptap/extension-text";
import Link from "@tiptap/extension-link";

export const MOTD_MAX_LENGTH = 2000;

/** Apply Tiptap's Link paste rules while preserving the original HTML markup. */
export function linkifyAnnouncementHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest("a, code, pre, script, style, textarea") && /\bhttps?:\/\//i.test(node.data)) nodes.push(node);
  }
  if (!nodes.length) return html;

  // Isolate text blocks so Link can recognize URLs without normalizing custom HTML.
  const editor = new Editor({
    injectCSS: false,
    extensions: [
      Document,
      Paragraph,
      TextExtension,
      Link.configure({
        autolink: false,
        linkOnPaste: false,
        openOnClick: false,
        isAllowedUri: (url, { defaultValidate }) => /^https?:\/\//i.test(url) && defaultValidate(url),
      }),
    ],
  });
  try {
    const content: JSONContent[] = nodes.map((node) => ({ type: "paragraph", content: [{ type: "text", text: node.data }] }));
    // The native paste transaction runs Link's paste rules for every text block.
    editor.chain().insertContent(content, { updateSelection: false }).setMeta("uiEvent", "paste").run();
    let changed = false;
    editor.getJSON().content?.forEach((block, index) => {
      if (!block.content?.some((segment) => segment.marks?.some((mark) => mark.type === "link"))) return;
      const fragment = document.createDocumentFragment();
      for (const segment of block.content) {
        const link = segment.marks?.find((mark) => mark.type === "link");
        if (link) {
          const anchor = document.createElement("a");
          anchor.setAttribute("href", String(link.attrs?.href));
          anchor.textContent = segment.text ?? "";
          fragment.append(anchor);
        } else fragment.append(segment.text ?? "");
      }
      nodes[index].replaceWith(fragment);
      changed = true;
    });
    return changed ? template.innerHTML : html;
  } finally {
    editor.destroy();
  }
}
