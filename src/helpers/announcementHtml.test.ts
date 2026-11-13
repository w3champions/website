// @vitest-environment jsdom
/* eslint-disable @stylistic/quotes -- HTML fixtures contain quoted attributes. */
import { describe, expect, it } from "vitest";
import { linkifyAnnouncementHtml } from "./announcementHtml";

function parse(html: string): HTMLTemplateElement {
  const template = document.createElement("template");
  template.innerHTML = html;
  return template;
}

describe("MOTD links", () => {
  it("uses native link rules without normalizing unsupported custom markup", () => {
    const html = '<table style="font-family: monospace"><tr><td>Visit https://example.com/event</td></tr></table>';
    const result = parse(linkifyAnnouncementHtml(html));
    expect(result.content.querySelector("table")?.style.fontFamily).toBe("monospace");
    expect(result.content.querySelector("td a")?.getAttribute("href")).toBe("https://example.com/event");
    expect(result.content.textContent).toBe(parse(html).content.textContent);
  });

  it("maps native link marks back to their original text nodes", () => {
    const result = parse(linkifyAnnouncementHtml("<p>No URL here</p><h3>https://example.com/one</h3><p>http://example.com/two</p>"));
    expect(result.content.querySelector("h3 a")?.getAttribute("href")).toBe("https://example.com/one");
    expect(result.content.querySelector("p a")?.getAttribute("href")).toBe("http://example.com/two");
    expect(result.content.querySelector("p")?.textContent).toBe("No URL here");
  });

  it("converts an announcement's plain URL into a saved HTML link", () => {
    const html = `<h3 style="color: #ffd428">Open Qualifier Today</h3><div>19.00 CEST - https://example.com/events/qualifier</div>`;
    const result = parse(linkifyAnnouncementHtml(html));
    const link = result.content.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://example.com/events/qualifier");
    expect(link.textContent).toBe("https://example.com/events/qualifier");
    expect(result.content.textContent).toBe(parse(html).content.textContent);
    expect(result.content.querySelector("h3")?.getAttribute("style")).toBe("color: #ffd428");
  });

  it("supports HTTP and HTTPS, query strings, punctuation and balanced parentheses", () => {
    const result = parse(linkifyAnnouncementHtml("<p>Visit https://example.com/?a=1&amp;b=2, or (http://example.com/Foo_(bar)).</p>"));
    expect([...result.content.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([
      "https://example.com/?a=1&b=2",
      "http://example.com/Foo_(bar)",
    ]);
    expect(result.content.textContent).toBe("Visit https://example.com/?a=1&b=2, or (http://example.com/Foo_(bar)).");
  });

  it("preserves existing links and does not linkify attributes or code", () => {
    const html = `<a href="https://example.com"><strong>https://example.com</strong></a><img src="https://example.com/a.png"><code>https://example.com/code</code><pre>http://example.com/pre</pre>`;
    expect(linkifyAnnouncementHtml(html)).toBe(html);
  });

  it("preserves messages without web URLs byte for byte", () => {
    const html = "<h3>GG HF</h3>\n<div></div>\n<br/>\n<div> </div>";
    expect(linkifyAnnouncementHtml(html)).toBe(html);
    expect(linkifyAnnouncementHtml("")).toBe("");
  });

  it("does not linkify bare domains, email addresses or other schemes", () => {
    const html = "www.example.com example.com admin@example.com ftp://example.com javascript:alert(1)";
    expect(linkifyAnnouncementHtml(html)).toBe(html);
  });

  it("can save the same message repeatedly without nesting links", () => {
    const once = linkifyAnnouncementHtml("Visit https://example.com");
    expect(linkifyAnnouncementHtml(once)).toBe(once);
    expect(parse(once).content.querySelectorAll("a")).toHaveLength(1);
  });

  it("escapes URL content when generating markup", () => {
    const result = parse(linkifyAnnouncementHtml("https://example.com/?q=&quot;hello&quot;&amp;page=1"));
    expect(result.content.querySelectorAll("a")).toHaveLength(1);
    expect(result.content.querySelectorAll("script, [onclick], [onerror]")).toHaveLength(0);
    expect(result.content.textContent).toBe(`https://example.com/?q="hello"&page=1`);
  });
});
