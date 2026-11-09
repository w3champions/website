import { describe, expect, it } from "vitest";
import { effectiveSource, installerUrl, nextSaved, otherSource, parseSavedSource } from "./launcherDownloadSource";

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

  it("otherSourceFlipsCnAndTreatsAutoAsGlobal", () => {
    expect(otherSource("cn")).toBe("global");
    expect(otherSource("global")).toBe("cn");
    expect(otherSource("auto")).toBe("cn");
  });

  it("parseSavedSourceRejectsUnknownValues", () => {
    expect(parseSavedSource("cn")).toBe("cn");
    expect(parseSavedSource("global")).toBe("global");
    expect(parseSavedSource("hk")).toBeNull();
    expect(parseSavedSource(null)).toBeNull();
  });
});
