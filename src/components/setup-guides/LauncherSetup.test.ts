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
const CJK = /[　-〿一-鿿＀-￯]/;

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

  const radios = () => wrapper!.findAll<HTMLInputElement>("fieldset input[type=radio]");
  const order = () => radios().map((r) => r.element.value);
  const checked = () => radios().filter((r) => r.element.checked).map((r) => r.element.value);
  const row = (source: string) => wrapper!.get(`[data-source=${source}]`);
  const badged = () => wrapper!.findAll(".source-badge").map((b) => b.element.closest("[data-source]")!.getAttribute("data-source"));
  const notice = () => wrapper!.get(".source-notice").text();
  const hintButtons = () => wrapper!.findAll(".source-hint button");
  const downloadHrefs = () => wrapper!.findAll("a.join-button").map((a) => a.attributes("href"));
  const describedBy = () => wrapper!.findAll("a.join-button").map((a) => a.attributes("aria-describedby"));
  const choose = (source: string) => wrapper!.get<HTMLInputElement>(`input[value=${source}]`).setValue(true);
  const hrefsFor = (source: string) => [
    `https://x/api/launcher-e/windows?source=${source}`,
    `https://x/api/launcher-e/mac-arm64?source=${source}`,
    `https://x/api/launcher-e/mac-x64?source=${source}`,
  ];

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

  it("outsideChinaListsStandardBackupChinaWithStandardCheckedAndBadged", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    expect(wrapper!.get("fieldset legend").text()).toBe("Download source");
    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(checked()).toEqual(["global"]);
    expect(badged()).toEqual(["global"]);
    expect(row("global").get(".source-badge").text()).toBe("Recommended for you");
    expect(row("global").text()).toContain("Standard download");
    expect(row("global").text()).toContain("Fastest for most players worldwide.");
    expect(row("intl").text()).toContain("Backup download");
    expect(notice()).toBe("");
    // No design E status line.
    expect(wrapper!.find(".source-status").exists()).toBe(false);
    expect(downloadHrefs()).toEqual(hrefsFor("global"));
  });

  it("detectedChinaPutsChinaFirstWithBadgeAndBilingualNotice", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["cn"]);
    expect(badged()).toEqual(["cn"]);
    const region = wrapper!.get(".source-notice");
    expect(region.attributes("aria-live")).toBe("polite");
    expect(notice()).toContain("You appear to be in mainland China, so we selected the download optimized for mainland China.");
    expect(region.get("[lang='zh-CN']").text()).toBe("检测到您在中国大陆，已自动选择专为中国大陆优化的下载。");
    // The notice sits above the list.
    expect(region.element.compareDocumentPosition(wrapper!.get("fieldset").element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(downloadHrefs()).toEqual(hrefsFor("cn"));
  });

  it("unknownDetectionChecksNothingShowsNoBadgeAndLinksAuto", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(checked()).toEqual([]);
    expect(badged()).toEqual([]);
    expect(notice()).toBe("");
    expect(downloadHrefs()).toEqual(hrefsFor("auto"));
  });

  it("choosingBackupSavesIntlAndRelinksButtons", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    await choose("intl");

    expect(localStorage.getItem(STORAGE_KEY)).toBe("intl");
    expect(checked()).toEqual(["intl"]);
    expect(downloadHrefs()).toEqual(hrefsFor("intl"));
    // The badge stays on the detected source; the choice does not move it.
    expect(badged()).toEqual(["global"]);
  });

  it("choosingTheDetectedSourceClearsTheSavedChoice", async () => {
    localStorage.setItem(STORAGE_KEY, "intl");
    fetchDetected.mockResolvedValue("global");
    await mountSetup();
    expect(checked()).toEqual(["intl"]);

    await choose("global");

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(checked()).toEqual(["global"]);
    expect(downloadHrefs()).toEqual(hrefsFor("global"));
  });

  it("savedDesignEChoiceStillLoads", async () => {
    localStorage.setItem(STORAGE_KEY, "cn");
    fetchDetected.mockResolvedValue("global");
    await mountSetup();
    expect(checked()).toEqual(["cn"]);
    expect(downloadHrefs()).toEqual(hrefsFor("cn"));
    wrapper!.unmount();

    localStorage.setItem(STORAGE_KEY, "global");
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();
    expect(checked()).toEqual(["global"]);
    expect(downloadHrefs()).toEqual(hrefsFor("global"));
    // A saved choice means the visitor already decided: no detection notice.
    expect(notice()).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("global");
  });

  it("zhSiteShowsChineseOnce", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup("zh");

    const cnText = row("cn").text();
    expect(cnText.split("中国大陆线路")).toHaveLength(2);
    expect(cnText.split("专为中国大陆下载优化")).toHaveLength(2);
    // Latin letters only in the brand name.
    expect(wrapper!.get("fieldset").text().replaceAll("W3Champions", "")).not.toMatch(/[A-Za-z]/);
    expect(notice().split("检测到您在中国大陆")).toHaveLength(2);
    expect(notice()).not.toMatch(/[A-Za-z]/);

    await wrapper!.findAll("a.join-button")[0].trigger("click");
    expect(hintButtons()).toHaveLength(1);
    expect(hintButtons()[0].text()).toBe("下载没反应或很慢？试试备用下载");
  });

  it("germanSiteShowsGermanTextPlusChineseOnChinaRowOnly", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup("de");

    expect(wrapper!.get("fieldset legend").text()).toBe("Download-Quelle");
    expect(row("global").text()).toContain("Standard-Download");
    expect(row("global").get(".source-badge").text()).toBe("Für dich empfohlen");
    expect(row("global").text()).not.toMatch(CJK);
    expect(row("intl").text()).not.toMatch(CJK);
    expect(row("cn").text()).toContain("Festland-China");
    expect(row("cn").text()).toContain("Optimiert für Downloads in Festland-China.");
    expect(row("cn").findAll("[lang='zh-CN']").map((e) => e.text())).toEqual(["中国大陆线路", "专为中国大陆下载优化"]);
  });

  it("noVisibleTextMentionsGithubServerOrMirror", async () => {
    for (const locale of Object.keys(languages)) {
      for (const detection of ["cn", "global"] as const) {
        fetchDetected.mockResolvedValue(detection);
        await mountSetup(locale);
        await wrapper!.findAll("a.join-button")[0].trigger("click");

        const text = wrapper!.get(".download-area").text();
        expect(text, `${locale}/${detection}`).not.toMatch(/github|asia|server|mirror|镜像/i);
        wrapper!.unmount();
        wrapper = undefined;
      }
    }
  });

  it("hintAfterChinaDownloadOffersBackupAndRestartsIt", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();
    expect(hintButtons()).toHaveLength(0);

    await wrapper!.findAll("a.join-button")[0].trigger("click");

    expect(hintButtons()).toHaveLength(1);
    expect(hintButtons()[0].text()).toContain("Download not starting or slow? Try Backup download");
    expect(hintButtons()[0].get("[lang='zh-CN']").text()).toBe("下载没反应或很慢？试试备用下载");

    await hintButtons()[0].trigger("click");

    expect(open).toHaveBeenCalledWith("https://x/api/launcher-e/windows?source=intl", "_blank", "noopener");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("intl");
    expect(checked()).toEqual(["intl"]);
    // The next suggestion follows the list order.
    expect(hintButtons()).toHaveLength(1);
    expect(hintButtons()[0].text()).toContain("Try Standard download");
  });

  it("hintAfterAutoDownloadOffersBackup", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    await wrapper!.findAll("a.join-button")[1].trigger("click");

    expect(hintButtons()).toHaveLength(1);
    expect(hintButtons()[0].text()).toBe("Download not starting or slow? Try Backup download");
    expect(hintButtons()[0].text()).not.toMatch(CJK);

    await hintButtons()[0].trigger("click");
    expect(open).toHaveBeenCalledWith("https://x/api/launcher-e/mac-arm64?source=intl", "_blank", "noopener");
  });

  it("hintToChinaForUndetectedVisitorAddsChinese", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();
    await choose("intl");

    await wrapper!.findAll("a.join-button")[0].trigger("click");

    expect(hintButtons()).toHaveLength(1);
    expect(hintButtons()[0].text()).toContain("Try Mainland China");
    expect(hintButtons()[0].get("[lang='zh-CN']").text()).toBe("下载没反应或很慢？试试中国大陆线路");
  });

  it("hintToChinaForOutsideVisitorAddsChinese", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();
    await choose("intl");

    await wrapper!.findAll("a.join-button")[0].trigger("click");

    expect(hintButtons()[0].text()).toContain("Try Mainland China");
    expect(hintButtons()[0].get("[lang='zh-CN']").text()).toBe("下载没反应或很慢？试试中国大陆线路");
  });

  it("focusStaysOnTheSameSourceWhenDetectionReorders", async () => {
    // Which rows the reorder moves in the DOM is up to Vue, so check every source.
    for (const source of ["global", "intl", "cn"]) {
      let resolveDetection!: (value: "cn") => void;
      fetchDetected.mockReturnValue(new Promise((resolve) => (resolveDetection = resolve)));
      await mountSetup();
      expect(order()).toEqual(["global", "intl", "cn"]);

      const radio = wrapper!.get<HTMLInputElement>(`input[value=${source}]`).element;
      radio.focus();
      expect(document.activeElement).toBe(radio);

      resolveDetection("cn");
      await flushPromises();

      expect(order()).toEqual(["cn", "intl", "global"]);
      expect((document.activeElement as HTMLInputElement | null)?.value, source).toBe(source);
      wrapper!.unmount();
      wrapper = undefined;
    }
  });

  it("buttonsAreDescribedByTheCheckedSourceName", async () => {
    fetchDetected.mockResolvedValue("global");
    await mountSetup();

    expect(describedBy()).toEqual(Array(3).fill("launcher-source-name-global"));
    expect(wrapper!.get("#launcher-source-name-global").text()).toBe("Standard download");

    await choose("cn");
    expect(describedBy()).toEqual(Array(3).fill("launcher-source-name-cn"));
    expect(wrapper!.get("#launcher-source-name-cn").text()).toContain("Mainland China");
  });

  it("buttonsHaveNoDescriptionWhileNothingIsChecked", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    expect(describedBy()).toEqual([undefined, undefined, undefined]);
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

    await choose("cn");

    expect(checked()).toEqual(["cn"]);
    expect(downloadHrefs()).toEqual(hrefsFor("cn"));
  });
});
