import { describe, expect, it } from "vitest";
import { resolveLang } from "./content";

describe("resolveLang", () => {
  it.each([["zh", "en", "zh"], ["en", "zh", "en"], [["zh", "en"], "en", "zh"], [["en"], "zh-CN", "en"]])(
    "query %j with locale %s resolves to %s",
    (query, locale, expected) => {
      expect(resolveLang(query, locale)).toBe(expected);
    },
  );

  it.each(["fr", "", undefined, 5, []])("falls back to locale for invalid query %j", (query) => {
    expect(resolveLang(query, "zh")).toBe("zh");
    expect(resolveLang(query, "en")).toBe("en");
  });

  it.each([["zh", "zh"], ["zh-TW", "zh"], ["zh-CN", "zh"], ["en", "en"], ["de", "en"]])(
    "locale %s resolves to %s without a query",
    (locale, expected) => {
      expect(resolveLang(undefined, locale)).toBe(expected);
    },
  );
});
