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
const DETECTED_KEY = "w3c-launcher-detected-source";
const CJK = /[　-〿一-鿿＀-￯]/;

describe("LauncherSetup download source", () => {
  let wrapper: VueWrapper | undefined;
  let open: ReturnType<typeof vi.fn>;

  async function mountSetup(locale = "en", { settle = true } = {}) {
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
    if (settle) await flushPromises();
    return wrapper;
  }

  const radios = () => wrapper!.findAll<HTMLInputElement>("fieldset input[type=radio]");
  const order = () => radios().map((r) => r.element.value);
  const checked = () => radios().filter((r) => r.element.checked).map((r) => r.element.value);
  const row = (source: string) => wrapper!.get(`[data-source=${source}]`);
  // Rows showing the badge; the first row also holds a hidden one while nothing is recommended.
  const badged = () => wrapper!.findAll(".source-badge:not(.source-badge--reserved)").map((b) => b.element.closest("[data-source]")!.getAttribute("data-source"));
  const badgeRows = () => wrapper!.findAll(".source-badge").map((b) => b.element.closest("[data-source]")!.getAttribute("data-source"));
  const firstBadge = () => wrapper!.get("[data-source]:first-child .source-badge");
  const veil = () => wrapper!.find(".source-veil");
  const optionsBox = () => wrapper!.get(".source-options");
  const noNotice = () => expect(wrapper!.find(".source-notice").exists()).toBe(false);
  const hintButtons = () => wrapper!.findAll(".source-hint button");
  const downloadHrefs = () => wrapper!.findAll("a.join-button").map((a) => a.attributes("href"));
  const describedBy = () => wrapper!.findAll("a.join-button").map((a) => a.attributes("aria-describedby"));
  const choose = (source: string) => wrapper!.get<HTMLInputElement>(`input[value=${source}]`).setValue(true);
  const hrefsFor = (source: string) => [
    `https://x/api/launcher-e/windows?source=${source}`,
    `https://x/api/launcher-e/mac-arm64?source=${source}`,
    `https://x/api/launcher-e/mac-x64?source=${source}`,
  ];

  /** Detection that answers only when the test says so. */
  function holdDetection() {
    let answer!: (value: "cn" | "global" | null) => Promise<void>;
    fetchDetected.mockReturnValue(
      new Promise((resolve) => {
        answer = async (value) => {
          resolve(value);
          await flushPromises();
        };
      }),
    );
    return (value: "cn" | "global" | null) => answer(value);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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
    noNotice();
    // No design E status line.
    expect(wrapper!.find(".source-status").exists()).toBe(false);
    expect(downloadHrefs()).toEqual(hrefsFor("global"));
  });

  it("detectedChinaPutsChinaFirstCheckedAndBadgedWithoutNotice", async () => {
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();

    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["cn"]);
    expect(badged()).toEqual(["cn"]);
    noNotice();
    expect(wrapper!.text()).not.toContain("You appear to be in mainland China");
    expect(downloadHrefs()).toEqual(hrefsFor("cn"));
  });

  it("unknownDetectionChecksNothingShowsNoBadgeAndLinksAuto", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(checked()).toEqual([]);
    expect(badged()).toEqual([]);
    noNotice();
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

    // Another browser session, so detection runs again.
    sessionStorage.clear();
    localStorage.setItem(STORAGE_KEY, "global");
    fetchDetected.mockResolvedValue("cn");
    await mountSetup();
    expect(checked()).toEqual(["global"]);
    expect(downloadHrefs()).toEqual(hrefsFor("global"));
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
    expect(row("cn").get(".source-desc").text()).toBe("Optimiert für Downloads in Festland-China. 专为中国大陆下载优化");
  });

  it("noVisibleTextMentionsGithubServerOrMirror", async () => {
    for (const locale of Object.keys(languages)) {
      for (const detection of ["cn", "global"] as const) {
        sessionStorage.clear();
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

  it("pendingVeilsAnInertBusyListWhileButtonsLinkAuto", async () => {
    const answer = holdDetection();
    await mountSetup();

    expect(veil().exists()).toBe(true);
    expect(veil().attributes("role")).toBe("status");
    expect(veil().text()).toBe("Finding the best download for you…");
    expect(optionsBox().attributes("inert")).toBeDefined();
    expect(optionsBox().attributes("aria-busy")).toBe("true");
    // Laid out as it will be without an answer.
    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(downloadHrefs()).toEqual(hrefsFor("auto"));
    expect(wrapper!.findAll("a.join-button").every((a) => a.attributes("disabled") === undefined)).toBe(true);

    await answer("global");

    expect(veil().exists()).toBe(false);
    expect(optionsBox().attributes("inert")).toBeUndefined();
    expect(optionsBox().attributes("aria-busy")).toBeUndefined();
  });

  it("pendingButtonsFollowTheSavedChoice", async () => {
    localStorage.setItem(STORAGE_KEY, "intl");
    const answer = holdDetection();
    await mountSetup();

    expect(veil().exists()).toBe(true);
    expect(downloadHrefs()).toEqual(hrefsFor("intl"));

    await answer("cn");

    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["intl"]);
    expect(downloadHrefs()).toEqual(hrefsFor("intl"));
  });

  it("chinaAnswerLiftsVeilWithChinaFirstCheckedAndBadged", async () => {
    const answer = holdDetection();
    await mountSetup();

    await answer("cn");

    expect(veil().exists()).toBe(false);
    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["cn"]);
    expect(firstBadge().classes()).not.toContain("source-badge--reserved");
    expect(firstBadge().attributes("aria-hidden")).toBeUndefined();
    expect(badged()).toEqual(["cn"]);
    noNotice();
  });

  it("globalAnswerLiftsVeilWithStandardFirstAndBadged", async () => {
    const answer = holdDetection();
    await mountSetup();

    await answer("global");

    expect(veil().exists()).toBe(false);
    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(checked()).toEqual(["global"]);
    expect(firstBadge().attributes("aria-hidden")).toBeUndefined();
    expect(badged()).toEqual(["global"]);
  });

  it("unknownAnswerLiftsVeilAndKeepsTheBadgeSpaceHidden", async () => {
    const answer = holdDetection();
    await mountSetup();

    await answer(null);

    expect(veil().exists()).toBe(false);
    expect(order()).toEqual(["global", "intl", "cn"]);
    expect(firstBadge().classes()).toContain("source-badge--reserved");
    expect(firstBadge().attributes("aria-hidden")).toBe("true");
    expect(firstBadge().text()).toBe("Recommended for you");
    expect(badged()).toEqual([]);
  });

  it("onlyTheFirstRowEverHoldsTheBadge", async () => {
    for (const result of ["cn", "global", null] as const) {
      sessionStorage.clear();
      const answer = holdDetection();
      await mountSetup();
      expect(badgeRows(), "pending").toEqual(["global"]);
      expect(firstBadge().attributes("aria-hidden"), "pending").toBe("true");

      await answer(result);

      expect(badgeRows(), String(result)).toEqual([order()[0]]);
      wrapper!.unmount();
      wrapper = undefined;
    }
  });

  it("rememberedChinaAnswerRendersFinalStateFirstWithoutAsking", async () => {
    sessionStorage.setItem(DETECTED_KEY, "cn");
    await mountSetup("en", { settle: false });

    expect(veil().exists()).toBe(false);
    expect(optionsBox().attributes("inert")).toBeUndefined();
    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["cn"]);
    expect(badged()).toEqual(["cn"]);
    expect(downloadHrefs()).toEqual(hrefsFor("cn"));
    await flushPromises();
    expect(fetchDetected).not.toHaveBeenCalled();
  });

  it("rememberedAnswerStillClearsASavedChoiceThatEqualsIt", async () => {
    sessionStorage.setItem(DETECTED_KEY, "cn");
    localStorage.setItem(STORAGE_KEY, "cn");
    await mountSetup();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(checked()).toEqual(["cn"]);
  });

  it("definiteAnswersAreRememberedForTheSession", async () => {
    for (const result of ["cn", "global"] as const) {
      sessionStorage.clear();
      const answer = holdDetection();
      await mountSetup();
      expect(sessionStorage.getItem(DETECTED_KEY)).toBeNull();

      await answer(result);

      expect(sessionStorage.getItem(DETECTED_KEY)).toBe(result);
      wrapper!.unmount();
      wrapper = undefined;
    }
  });

  it("unknownAnswerIsNotRemembered", async () => {
    fetchDetected.mockResolvedValue(null);
    await mountSetup();

    expect(sessionStorage.getItem(DETECTED_KEY)).toBeNull();
  });

  it("invalidRememberedAnswerIsIgnored", async () => {
    sessionStorage.setItem(DETECTED_KEY, "intl");
    holdDetection();
    await mountSetup();

    expect(fetchDetected).toHaveBeenCalledOnce();
    expect(veil().exists()).toBe(true);
    expect(order()).toEqual(["global", "intl", "cn"]);
  });

  it("storageThrowingOnReadAndWriteStillDetectsAndWorks", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const answer = holdDetection();
    await mountSetup();
    expect(veil().exists()).toBe(true);

    await answer("cn");

    expect(veil().exists()).toBe(false);
    expect(order()).toEqual(["cn", "intl", "global"]);
    expect(checked()).toEqual(["cn"]);
    await choose("intl");
    expect(checked()).toEqual(["intl"]);
    expect(downloadHrefs()).toEqual(hrefsFor("intl"));
  });
});
