import { describe, expect, it } from "vitest";
import { chineseSupplement, effectiveSource, fallbackSource, installerUrl, nextSaved, orderedSources, parseDetectedSource, parseSavedSource } from "./launcherDownloadSource";

describe("launcherDownloadSource", () => {
  it("savedChoiceWinsOverDetection", () => {
    expect(effectiveSource("cn", "global")).toBe("global");
    expect(effectiveSource("global", "cn")).toBe("cn");
  });

  it("detectedUsedWhenNothingSaved", () => {
    expect(effectiveSource("cn", null)).toBe("cn");
    expect(effectiveSource("global", null)).toBe("global");
  });

  it("unknownDetectionIsAuto", () => {
    expect(effectiveSource(null, null)).toBe("auto");
    expect(effectiveSource(null, "cn")).toBe("cn");
  });

  it("choosingDetectedSourceClearsSavedChoice", () => {
    expect(nextSaved("cn", "cn")).toBeNull();
    expect(nextSaved("cn", "global")).toBe("global");
    expect(nextSaved("global", "cn")).toBe("cn");
    // Nothing to follow when detection failed, so the choice is kept.
    expect(nextSaved(null, "global")).toBe("global");
  });

  it("installerUrlAppendsPlatformAndSource", () => {
    expect(installerUrl("https://x/api/", "mac-arm64", "cn")).toBe("https://x/api/launcher-e/mac-arm64?source=cn");
    expect(installerUrl("https://x/api/", "windows", "auto")).toBe("https://x/api/launcher-e/windows?source=auto");
  });

  it("parseSavedSourceRejectsUnknownValues", () => {
    expect(parseSavedSource("cn")).toBe("cn");
    expect(parseSavedSource("global")).toBe("global");
    expect(parseSavedSource("hk")).toBeNull();
    expect(parseSavedSource(null)).toBeNull();
  });

  it("detectedSourceComesFirstThenTheLikeliestToWork", () => {
    expect(orderedSources("cn")).toEqual(["cn", "intl", "global"]);
    expect(orderedSources("global")).toEqual(["global", "intl", "cn"]);
    expect(orderedSources(null)).toEqual(["global", "intl", "cn"]);
  });

  it("fallbackIsTheNextSourceAndBackupAfterAuto", () => {
    expect(fallbackSource("cn", "cn")).toBe("intl");
    expect(fallbackSource("intl", "cn")).toBe("global");
    expect(fallbackSource("global", "cn")).toBe("cn");
    expect(fallbackSource("global", "global")).toBe("intl");
    expect(fallbackSource("cn", "global")).toBe("global");
    expect(fallbackSource("auto", null)).toBe("intl");
  });

  it("chineseSupplementOnlyWhenSiteTextIsNotAlreadyThatChinese", () => {
    expect(chineseSupplement("Mainland China", "中国大陆线路")).toBe("中国大陆线路");
    expect(chineseSupplement("中国大陆线路", "中国大陆线路")).toBeNull();
  });

  it("parseSavedSourceAcceptsAllThreeSources", () => {
    for (const s of ["global", "intl", "cn"]) expect(parseSavedSource(s)).toBe(s);
    expect(parseSavedSource("mirror")).toBeNull();
  });

  it("parseDetectedSourceAcceptsOnlyDetectionAnswers", () => {
    expect(parseDetectedSource("cn")).toBe("cn");
    expect(parseDetectedSource("global")).toBe("global");
    for (const raw of ["intl", "auto", "", "CN", null]) expect(parseDetectedSource(raw)).toBeNull();
  });

  it("installerUrlCarriesIntl", () => {
    expect(installerUrl("https://x/api/", "windows", "intl")).toBe("https://x/api/launcher-e/windows?source=intl");
  });
});
