import { describe, expect, it } from "vitest";
import { parseLangQuery, resolveLang } from "./content";

describe("resolveLang", () => {
  it.each([["zh", "zh"], ["zh-TW", "zh"], ["zh-CN", "zh"], ["ZH", "zh"], ["en", "en"], ["de", "en"], ["", "en"]])(
    "site locale %s resolves to %s",
    (locale, expected) => {
      expect(resolveLang(locale)).toBe(expected);
    },
  );
});

describe("parseLangQuery", () => {
  it.each([["zh", "zh"], ["en", "en"], [["zh", "en"], "zh"], [["en"], "en"]])(
    "query %j parses to %s",
    (query, expected) => {
      expect(parseLangQuery(query)).toBe(expected);
    },
  );

  it.each(["fr", "ZH", "", undefined, null, 5, [], [""], ["fr", "zh"]])("ignores invalid query %j", (query) => {
    expect(parseLangQuery(query)).toBeUndefined();
  });
});
