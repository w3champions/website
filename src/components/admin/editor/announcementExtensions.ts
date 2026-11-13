import { Extension, type Extensions } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Code from "@tiptap/extension-code";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import History from "@tiptap/extension-history";
import Dropcursor from "@tiptap/extension-dropcursor";
import HardBreak from "@tiptap/extension-hard-break";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";

const layoutProperties = ["margin", "margin-top", "margin-right", "margin-bottom", "margin-left", "text-align"];
const blockTags = new Set(["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL", "LI"]);
const supportedTags = new Set([...blockTags, "STRONG", "B", "EM", "I", "U", "S", "STRIKE", "DEL", "CODE", "SPAN", "A", "IMG", "HR", "BR"]);

/** Leave custom markup in HTML mode rather than silently discarding it. */
export function needsHtmlMode(html: string): boolean {
  const template = document.createElement("template");
  template.innerHTML = html;
  return [...template.content.querySelectorAll<HTMLElement>("*")].some((element) => {
    if (!supportedTags.has(element.tagName)) return true;
    const attributes: Record<string, string[]> = { A: ["href", "target", "rel", "class"], IMG: ["src", "alt", "title"], OL: ["start"] };
    if ([...element.attributes].some((attribute) => attribute.name !== "style" && !attributes[element.tagName]?.includes(attribute.name))) return true;
    return [...element.style].some((property) => {
      if (property === "color") return !blockTags.has(element.tagName) && element.tagName !== "SPAN";
      return !blockTags.has(element.tagName) || !layoutProperties.includes(property);
    });
  });
}

export function announcementExtensions(): Extensions {
  return [
    Document,
    Paragraph.extend({ parseHTML: () => [{ tag: "p" }, { tag: "div" }] }),
    Text,
    Heading,
    Bold,
    Italic,
    Underline,
    Strike,
    Code,
    Link.configure({ openOnClick: false, shouldAutoLink: (url) => /^https?:\/\//i.test(url) }),
    Image,
    BulletList,
    OrderedList,
    ListItem,
    HorizontalRule,
    History,
    Dropcursor,
    HardBreak,
    TextStyle,
    Color.configure({ types: ["textStyle", "heading", "paragraph", "bulletList", "orderedList", "listItem"] }),
    Extension.create({
      name: "announcementLayout",
      addGlobalAttributes() {
        return [{
          types: ["heading", "paragraph", "bulletList", "orderedList", "listItem"],
          attributes: {
            layout: {
              default: null,
              parseHTML: (element: HTMLElement) => {
                const styles = layoutProperties.filter((property) => element.style.getPropertyValue(property)).map((property) => `${property}: ${element.style.getPropertyValue(property)}`);
                if (element.tagName === "DIV" && !element.style.margin) styles.push("margin: 0");
                return styles.join("; ") || null;
              },
              renderHTML: (attributes: Record<string, unknown>) => attributes.layout ? { style: attributes.layout } : {},
            },
          },
        }];
      },
    }),
  ];
}
