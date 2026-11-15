// @vitest-environment jsdom
/* eslint-disable @stylistic/quotes -- HTML fixtures contain quoted attributes. */
import { describe, expect, it } from "vitest";
import { generateHTML, generateJSON } from "@tiptap/core";
import { announcementExtensions, needsHtmlMode } from "./announcementExtensions";

function roundTrip(html: string): HTMLElement {
  const extensions = announcementExtensions();
  const element = document.createElement("div");
  element.innerHTML = generateHTML(generateJSON(html, extensions), extensions);
  return element;
}

describe("announcement editor formatting", () => {
  it("preserves heading colors, margins, emphasis and line breaks", () => {
    const html = '<h3 style="color: #ffd428; margin: 0 0 10px"><strong>Community Event</strong></h3><div>Join today<br>https://example.com/event</div>';
    expect(needsHtmlMode(html)).toBe(false);
    const result = roundTrip(html);
    expect(result.querySelector("h3")?.style.color).toBe("rgb(255, 212, 40)");
    expect(result.querySelector("h3")?.style.margin).toBe("0px 0px 10px");
    expect(result.querySelector("strong")?.textContent).toBe("Community Event");
    expect(result.querySelector("br")).not.toBeNull();
    expect(result.querySelector("p")?.style.margin).toBe("0px");
  });

  it("preserves text colors, lists, links and images", () => {
    const result = roundTrip('<p><span style="color: red">Red text</span></p><ul><li><p>One</p></li></ul><a href="https://example.com/event">Details</a><img src="https://example.com/banner.png">');
    expect(result.querySelector("span")?.style.color).toBe("red");
    expect(result.querySelectorAll("li")).toHaveLength(1);
    expect(result.querySelector("a")?.getAttribute("href")).toBe("https://example.com/event");
    expect(result.querySelector("img")?.getAttribute("src")).toBe("https://example.com/banner.png");
  });

  it.each([
    "<table><tr><td>Custom layout</td></tr></table>",
    '<p style="font-family: monospace">Custom font</p>',
    '<strong style="color: red">Custom inline style</strong>',
    '<script>alert("test")</script>',
  ])("keeps unsupported custom HTML in HTML mode: %s", (html) => {
    expect(needsHtmlMode(html)).toBe(true);
  });
});
