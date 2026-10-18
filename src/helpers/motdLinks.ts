import { find } from "linkifyjs";

export const MOTD_MAX_LENGTH = 2000;

/** Convert web URLs in MOTD text to links without changing existing HTML links. */
export function linkifyMotd(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (!node.parentElement?.closest("a, code, pre, script, style, textarea")) nodes.push(node);
  }

  let changed = false;
  for (const node of nodes) {
    const links = find(node.data).filter((link) => link.type === "url" && /^https?:\/\//i.test(link.value));
    if (!links.length) continue;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const link of links) {
      fragment.append(node.data.slice(offset, link.start));
      const anchor = document.createElement("a");
      anchor.setAttribute("href", link.href);
      anchor.textContent = link.value;
      fragment.append(anchor);
      offset = link.end;
    }
    fragment.append(node.data.slice(offset));
    node.replaceWith(fragment);
    changed = true;
  }
  return changed ? template.innerHTML : html;
}
