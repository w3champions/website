// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import { createI18n } from "vue-i18n";
import languages from "@/locales/languages";
import LauncherSetup from "@/components/setup-guides/LauncherSetup.vue";

const { fetchDetected } = vi.hoisted(() => ({ fetchDetected: vi.fn() }));

vi.mock("@/services/LauncherDownloadSourceService", () => ({ default: { fetchDetected } }));
vi.mock("@/config/env", () => ({ LAUNCHER_UPDATE_URL: "https://x/api/" }));
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: vi.fn() }),
}));

const STORAGE_KEY = "w3c-launcher-download-source";

describe("LauncherSetup download source", () => {
  let wrapper: VueWrapper | undefined;
  let open: ReturnType<typeof vi.fn>;

  async function mountSetup(locale = "en") {
    // jsdom lacks the observer Vuetify's tabs use.
    globalThis.ResizeObserver ??= class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    wrapper = mount(LauncherSetup, {
      attachTo: document.body,
      global: {
        plugins: [
          createVuetify(),
          createI18n({ legacy: false, locale, fallbackLocale: "en", messages: languages }),
        ],
      },
    });
    await flushPromises();
    return wrapper;
  }

  // The notice (state 1, above the buttons) and the status line (below) are one story.
  const status = () => wrapper!.findAll(".source-controls").map((e) => e.text()).filter(Boolean).join(" ");
  const hint = () => wrapper!.get(".source-hint").text();
  const downloadHrefs = () => wrapper!.findAll("a.join-button").map((a) => a.attributes("href"));
  const switchButton = (text: string) => wrapper!.findAll("button").find((b) => b.text().includes(text));

  // body.textContent holds the whole page, so focus on <body> must not pass: require a button.
  const focusedButtonText = () => (document.activeElement?.tagName === "BUTTON" ? document.activeElement.textContent : "");

  beforeEach(() => {
    localStorage.clear();
    fetchDetected.mockReset();
    open = vi.fn();
    vi.stubGlobal("open", open);
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("detectedChinaShowsBilingualNotice", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    expect(status()).toContain("检测到您在中国大陆，已自动使用中国大陆线路下载。");
    expect(status()).toContain("You appear to be in mainland China, so downloads use our China mainland source.");
    expect(status()).toContain("改用国际线路（GitHub）");
    expect(status()).toContain("Use Global (GitHub)");
    expect(wrapper!.find(".source-controls [lang='zh-CN']").exists()).toBe(true);
    expect(downloadHrefs()).toEqual([
      "https://x/api/launcher-e/windows?source=cn",
      "https://x/api/launcher-e/mac-arm64?source=cn",
      "https://x/api/launcher-e/mac-x64?source=cn",
    ]);
  });

  it("globalShowsChineseOnlyChinaLink", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    expect(status()).toBe("Download source: Global (GitHub) · 中国大陆用户：使用中国大陆线路");
    expect(downloadHrefs()[0]).toBe("https://x/api/launcher-e/windows?source=global");
  });

  it("unknownDetectionShowsOnlyChineseLinkAndUsesAuto", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    expect(status()).toBe("中国大陆用户：使用中国大陆线路");
    expect(downloadHrefs()[0]).toBe("https://x/api/launcher-e/windows?source=auto");
  });

  it("manualSwitchPersistsAndRelabels", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    await switchButton("中国大陆用户")!.trigger("click");

    expect(localStorage.getItem(STORAGE_KEY)).toBe("cn");
    expect(status()).toContain("Download source: China mainland · 中国大陆线路");
    expect(status()).toContain("chosen by you");
    expect(status()).toContain("Use Global (GitHub)");
    expect(downloadHrefs()[0]).toBe("https://x/api/launcher-e/windows?source=cn");

    // Going back to what detection picks clears the saved choice.
    await switchButton("Use Global (GitHub)")!.trigger("click");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(status()).toBe("Download source: Global (GitHub) · 中国大陆用户：使用中国大陆线路");
  });

  it("savedChoiceIsAppliedOnLoad", async () => {
    localStorage.setItem(STORAGE_KEY, "cn");
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    expect(downloadHrefs()[0]).toBe("https://x/api/launcher-e/windows?source=cn");
  });

  it("hintAfterClickOpensOtherSourceAndSaves", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();
    expect(hint()).toBe("");

    await wrapper!.findAll("a.join-button")[1].trigger("click");
    expect(hint()).toBe("下载没反应或很慢？用中国大陆线路重新下载 macOS (Apple Silicon) 版");

    await wrapper!.get(".source-hint button").trigger("click");

    expect(open).toHaveBeenCalledWith("https://x/api/launcher-e/mac-arm64?source=cn", "_blank", "noopener");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("cn");
    expect(hint()).toContain("下载没反应或很慢？试试国际线路（GitHub）");
    expect(hint()).toContain("Not starting? Try Global (GitHub)");
  });

  it("zhLocaleDropsEnglishNoticeLine", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup("zh");

    expect(status()).toContain("检测到您在中国大陆");
    expect(status()).not.toContain("You appear to be in mainland China");
    expect(status()).not.toContain("Use Global (GitHub)");
  });

  it("localStorageThrowingStillRenders", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    await switchButton("中国大陆用户")!.trigger("click");

    expect(downloadHrefs()[0]).toBe("https://x/api/launcher-e/windows?source=cn");
  });

  it("downloadButtonsReferenceTheStatusLine", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    const id = wrapper!.get(".source-status").attributes("id");
    expect(id).toBeTruthy();
    for (const a of wrapper!.findAll("a.join-button")) expect(a.attributes("aria-describedby")).toBe(id);
  });

  it("stateOneNoticeIsAboveTheButtons", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    const notice = wrapper!.get(".source-notice").element;
    const firstButton = wrapper!.get("a.join-button").element;
    expect(notice.compareDocumentPosition(firstButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(wrapper!.get(".source-notice").text()).toContain("检测到您在中国大陆");
    for (const a of wrapper!.findAll("a.join-button")) {
      expect(a.attributes("aria-describedby")).toBe(wrapper!.get(".source-notice").attributes("id"));
    }
  });

  it("statusAndNoticeAreLiveRegions", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    expect(wrapper!.get(".source-status").attributes("aria-live")).toBe("polite");
    expect(wrapper!.get(".source-notice").attributes("aria-live")).toBe("polite");
  });

  it("focusMovesToTheNewSwitchAfterSwitching", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    await switchButton("中国大陆用户")!.trigger("click");
    await flushPromises();
    expect(focusedButtonText()).toContain("Use Global (GitHub)");

    await switchButton("Use Global (GitHub)")!.trigger("click");
    await flushPromises();
    expect(focusedButtonText()).toContain("中国大陆用户");
  });

  it("focusMovesToTheNewSwitchWhenLeavingTheDetectedNotice", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    await switchButton("Use Global (GitHub)")!.trigger("click");
    await flushPromises();

    expect(focusedButtonText()).toContain("中国大陆用户");
  });

  it("savedChoiceEqualToDetectionShowsDetectedWordingAndIsCleared", async () => {
    localStorage.setItem(STORAGE_KEY, "cn");
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    expect(status()).toContain("You appear to be in mainland China");
    expect(status()).not.toContain("chosen by you");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("zhLocaleUsesChineseLabelsInStatusLine", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup("zh");
    expect(status()).toBe("下载线路：国际线路（GitHub） · 中国大陆用户：使用中国大陆线路");

    await switchButton("中国大陆用户")!.trigger("click");
    expect(status()).toContain("下载线路：中国大陆线路");
    expect(status()).toContain("（你的选择）");
    expect(status()).not.toContain("chosen by you");
    expect(status()).toContain("改用国际线路（GitHub）");
    expect(status()).not.toContain("Use Global (GitHub)");
  });

  it("zhLocaleDropsEnglishFromTheHint", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup("zh");

    await wrapper!.findAll("a.join-button")[0].trigger("click");

    expect(hint()).toBe("下载没反应或很慢？试试国际线路（GitHub）");
  });
});
