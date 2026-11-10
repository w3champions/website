// @vitest-environment node
import { describe, expect, it } from "vitest";
import languages from "@/locales/languages";
import { activeLanguages } from "../../scripts/active-languages";

type Block = Record<string, string>;
const blockOf = (lang: string): Block => (languages as unknown as Record<string, Record<string, Block>>)[lang].components_launchersetup;
const enKeys = Object.keys(blockOf("en")).sort();

describe("launcher setup copy", () => {
  it("everyActiveLanguageHasEveryLauncherSetupKey", () => {
    for (const lang of activeLanguages) {
      const block = blockOf(lang);
      expect(Object.keys(block).sort(), lang).toEqual(enKeys);
      for (const key of enKeys) expect(block[key].trim(), `${lang}.${key}`).not.toBe("");
    }
  });

  it("hintTryKeepsTheSourcePlaceholderInEveryLanguage", () => {
    for (const lang of activeLanguages) expect(blockOf(lang).hint_try, lang).toContain("{source}");
  });

  it("noLanguageNamesGithubAsiaServerOrMirror", () => {
    for (const lang of activeLanguages) {
      for (const [key, value] of Object.entries(blockOf(lang))) {
        expect(value, `${lang}.${key}`).not.toMatch(/github|asia|server|mirror|镜像/i);
      }
    }
  });
});
