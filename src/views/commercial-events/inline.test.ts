import { describe, expect, it } from "vitest";
import { parseInline, parseTemplate } from "./inline";

describe("parseInline", () => {
  it("returns plain text as a single segment", () => {
    expect(parseInline("hello")).toEqual([{ text: "hello", bold: false, italic: false }]);
  });

  it("parses bold and italic around plain text", () => {
    expect(parseInline("a **b** c *d*")).toEqual([
      { text: "a ", bold: false, italic: false },
      { text: "b", bold: true, italic: false },
      { text: " c ", bold: false, italic: false },
      { text: "d", bold: false, italic: true },
    ]);
  });

  it("keeps CJK text intact and tags Han runs inside Latin text", () => {
    expect(parseInline("**微信：** 赛事合作")).toEqual([
      { text: "微信：", bold: true, italic: false },
      { text: " ", bold: false, italic: false },
      { text: "赛事合作", bold: false, italic: false, lang: "zh-Hans" },
    ]);
    expect(parseInline("please mention 赛事合作 when adding")).toEqual([
      { text: "please mention ", bold: false, italic: false },
      { text: "赛事合作", bold: false, italic: false, lang: "zh-Hans" },
      { text: " when adding", bold: false, italic: false },
    ]);
  });

  it("does not format asterisks surrounded by spaces", () => {
    expect(parseInline("a * b * c")).toEqual([{ text: "a * b * c", bold: false, italic: false }]);
    expect(parseInline("a ** b ** c")).toEqual([{ text: "a ** b ** c", bold: false, italic: false }]);
  });
});

describe("parseTemplate", () => {
  it("splits text and tokens in order", () => {
    expect(parseTemplate("**A:** {id} (x)")).toEqual([{ kind: "text", text: "**A:** " }, { kind: "token", token: "id" }, { kind: "text", text: " (x)" }]);
  });

  it("returns plain text untouched", () => {
    expect(parseTemplate("plain")).toEqual([{ kind: "text", text: "plain" }]);
  });
});
