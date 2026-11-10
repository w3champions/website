<template>
  <v-row class="justify-center">
    <v-col cols="12">
      <v-container class="overflow-x-auto">
        <v-card-title>
          {{ $t("views_gettingstarted.howtoinstall") }}
        </v-card-title>

        <v-row>
          <!-- Tabs: always vertical, full width on mobile, sidebar on md+ -->
          <v-col cols="12" md="3">
            <v-tabs
              v-model="tabsModel.self"
              direction="vertical"
              class="ml-md-4"
            >
              <v-tab value="launcher">
                {{ $t("views_gettingstarted.launcher") }}
              </v-tab>
              <v-tab value="windows-setup">
                {{ $t("views_gettingstarted.manualwin") }}
              </v-tab>
            </v-tabs>
          </v-col>

          <!-- Content -->
          <v-col cols="12" md="9">
            <v-window :model-value="tabsModel.self">
              <!-- LAUNCHER TAB -->
              <v-window-item value="launcher">
                <v-card-text class="pt-0 px-3">
                  <h3>{{ $t("views_gettingstarted.downloadw3ctitle") }}</h3>
                  <br />
                  <v-card-text ref="downloadArea" class="pa-0">
                    <!-- State 1: the notice goes above the buttons. -->
                    <div aria-live="polite" class="source-controls source-notice text-body-2 text-high-emphasis" :class="{ 'mb-4': mode === 'detected-cn' }">
                      <template v-if="mode === 'detected-cn'">
                        <span :id="noticeTextId">
                          <span lang="zh-CN">{{ ZH.detectedNotice }}</span>
                          <template v-if="showEnglish">
                            <br />
                            <span>{{ $t("components_launchersetup.detected_notice") }}</span>
                          </template>
                        </span>
                        <br />
                        <button type="button" class="source-switch" @click="choose('global', true)">
                          <span lang="zh-CN">{{ ZH.useGlobal }}</span>
                          <template v-if="showEnglish">
                            <span aria-hidden="true"> · </span>{{ $t("components_launchersetup.global_name") }}
                          </template>
                        </button>
                      </template>
                    </div>

                    <div class="download-buttons">
                      <v-btn
                        v-for="platform in platforms"
                        :key="platform.id"
                        :href="platform.url"
                        :aria-describedby="describedBy"
                        target="_blank"
                        rel="noopener"
                        class="join-button mt-0"
                        @click="onDownloadClick(platform)"
                      >
                        <v-icon>{{ mdiDownload }}</v-icon>
                        <span class="mr-2">{{ platform.label }}</span>
                      </v-btn>
                    </div>

                    <p class="source-controls source-status text-body-2 text-high-emphasis mt-4 mb-1">
                      <template v-if="mode === 'unknown'">
                        <button type="button" class="source-switch" lang="zh-CN" @click="choose('cn', true)">
                          {{ ZH.useChina }}
                        </button>
                      </template>
                      <template v-else-if="mode !== 'detected-cn'">
                        <span :id="statusTextId" :lang="showEnglish ? undefined : 'zh-CN'">{{ statusLabel }}</span>
                        <span aria-hidden="true"> · </span>
                        <template v-if="mode === 'chosen'">
                          <template v-if="showEnglish">
                            <span lang="zh-CN">{{ source === "cn" ? ZH.china : ZH.global }}</span>{{ " " }}
                          </template>
                          <span v-if="showEnglish">({{ $t("components_launchersetup.recommended") }})</span>
                          <span v-else lang="zh-CN">{{ ZH.chosenByYou }}</span>
                          <span aria-hidden="true"> · </span>
                        </template>
                        <button
                          v-if="source === 'cn'"
                          type="button"
                          class="source-switch"
                          @click="choose('global', true)"
                        >
                          <span lang="zh-CN">{{ ZH.useGlobal }}</span>
                          <template v-if="showEnglish">
                            <span aria-hidden="true"> · </span>{{ $t("components_launchersetup.global_name") }}
                          </template>
                        </button>
                        <button v-else type="button" class="source-switch" lang="zh-CN" @click="choose('cn', true)">
                          {{ ZH.useChina }}
                        </button>
                      </template>
                    </p>

                    <div aria-live="polite" class="source-hint text-body-2 text-high-emphasis">
                      <div v-for="option in hints" :key="option.target">
                        <button type="button" class="source-switch" @click="onHintClick(option.target)">
                          <span lang="zh-CN">{{ option.zh }}</span>
                          <template v-if="option.showEnglish">
                            <span aria-hidden="true"> · </span>{{ $t("components_launchersetup.hint_try", { source: $t("components_launchersetup.global_name") }) }}
                          </template>
                        </button>
                      </div>
                    </div>
                  </v-card-text>
                  <h3>{{ $t("views_gettingstarted.launchertitle") }}</h3>
                  <br />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher1.jpg" />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher2.jpg" />
                  <img class="mb-3 w-100" src="/assets/gettingStarted/launcher3.jpg" />
                  <v-card-text>
                    {{ $t("views_gettingstarted.launcherfeaturestitle") }}
                    <ul>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody1") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody2") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody3") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody4") }}</li>
                      <li>{{ $t("views_gettingstarted.launcherfeaturesbody5") }}</li>
                    </ul>
                  </v-card-text>
                </v-card-text>
              </v-window-item>

              <!-- WINDOWS SETUP TAB -->
              <v-window-item value="windows-setup">
                <v-card-text class="pt-0 px-3">
                  <v-alert variant="outlined" type="info" prominent border="start">
                    {{ alertMessage }}
                  </v-alert>
                  <h3 class="mt-10">
                    {{ $t("views_gettingstarted.manualwintitle") }}
                  </h3>
                  <p>
                    {{ $t("views_gettingstarted.manualwinbody1") }}
                  </p>
                  <v-btn
                    color="primary"
                    :href="ingameAddonLink"
                    target="_blank"
                    variant="outlined"
                  >
                    <v-icon>{{ mdiDownload }}</v-icon>
                    <span class="mr-2 hidden-xs">
                      {{ $t("views_gettingstarted.manualwinbody2") }}
                    </span>
                  </v-btn>
                  <div class="mt-3">
                    <div>{{ $t("views_gettingstarted.manualwinbody3") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody3_1") }}</code>
                  </div>
                  <div class="mt-3">
                    <i style="color: red">{{ $t("views_gettingstarted.manualwinbody4") }}</i>
                    <div>{{ $t("views_gettingstarted.manualwinbody5") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody6") }}</code>
                    <div>{{ $t("views_gettingstarted.manualwinbody7") }}</div>
                    <code>{{ $t("views_gettingstarted.manualwinbody8") }}</code>
                  </div>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-col>
        </v-row>
      </v-container>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LAUNCHER_UPDATE_URL } from "@/config/env";
import { mdiDownload } from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import LauncherDownloadSourceService from "@/services/LauncherDownloadSourceService";
import {
  type DownloadSource,
  effectiveSource,
  installerUrl,
  type InstallerPlatform,
  type LinkSource,
  nextSaved,
} from "./launcherDownloadSource";
import { readSavedSource, writeSavedSource } from "./launcherDownloadSourceStorage";

// Interim Chinese strings until the picker rewrite replaces this block.
const ZH = {
  label: "下载线路",
  global: "标准下载",
  china: "中国大陆线路",
  detectedNotice: "检测到您在中国大陆，已自动选择专为中国大陆优化的下载。",
  chosenByYou: "（你的选择）",
  useChina: "中国大陆用户：使用中国大陆线路",
  useGlobal: "改用标准下载",
  hintGlobalSource: (platformName: string) => `下载没反应或很慢？用中国大陆线路重新下载 ${platformName} 版`,
  hintChinaSource: "下载没反应或很慢？试试标准下载",
} as const;

interface PlatformEntry {
  id: InstallerPlatform;
  label: string;
}

const PLATFORMS: PlatformEntry[] = [
  { id: "windows", label: "Windows" },
  { id: "mac-arm64", label: "macOS (Apple Silicon)" },
  { id: "mac-x64", label: "macOS (Intel)" },
];

// The short sentence the download buttons are described by (never the switch links).
const NOTICE_TEXT_ID = "launcher-download-source-notice-text";
const STATUS_TEXT_ID = "launcher-download-source-status-text";

export default defineComponent({
  name: "LauncherSetup",
  components: {},
  setup() {
    const alertMessage = ref<string>("These steps are only needed if you have problems with the normal W3Champions App. In that case, please reach out on Discord!");
    const ingameAddonLink = ref<string>(LAUNCHER_UPDATE_URL + "ingame-addon");
    const route = useRoute();
    const router = useRouter();
    const { locale, t } = useI18n();
    const downloadArea = ref<{ $el: HTMLElement } | null>(null);
    const tabsModel = ref({ self: (route.query.tabsModel as string) || "launcher" });

    const detected = ref<DownloadSource | null>(null);
    const saved = ref<DownloadSource | null>(readSavedSource());
    // The last download the visitor started, and the source it came from.
    const lastClick = ref<{ platform: PlatformEntry; source: LinkSource } | null>(null);

    function isSwitchFocused(): boolean {
      const active = document.activeElement;
      return !!active?.classList.contains("source-switch") && !!active.closest(".source-controls");
    }

    async function focusSwitch() {
      await nextTick();
      downloadArea.value?.$el.querySelector<HTMLElement>(".source-controls .source-switch")?.focus();
    }

    onMounted(async () => {
      const answer = await LauncherDownloadSourceService.fetchDetected();
      // The answer can replace the switch the visitor is on; focus must follow it.
      const hadFocus = isSwitchFocused();
      detected.value = answer;
      // A saved choice that equals what detection picks is no longer a choice.
      if (detected.value !== null && saved.value === detected.value) {
        saved.value = nextSaved(detected.value, saved.value);
        writeSavedSource(saved.value);
      }
      if (hadFocus) await focusSwitch();
    });

    const linkSource = computed(() => effectiveSource(detected.value, saved.value));
    // The source named in the status line; while detection is unknown nothing is claimed.
    const source = computed<DownloadSource>(() => (linkSource.value === "cn" ? "cn" : "global"));
    const mode = computed(() => {
      if (saved.value !== null) return "chosen";
      if (detected.value === "cn") return "detected-cn";
      return detected.value === null ? "unknown" : "global";
    });
    const showEnglish = computed(() => !locale.value.startsWith("zh"));
    // "Download source: Global (GitHub)", in Chinese for the Chinese site language.
    const statusLabel = computed(() =>
      showEnglish.value
        ? `${t("components_launchersetup.label")}: ${t(`components_launchersetup.${source.value}_name`)}`
        : `${ZH.label}：${source.value === "cn" ? ZH.china : ZH.global}`
    );

    const describedBy = computed(() => {
      if (mode.value === "detected-cn") return NOTICE_TEXT_ID;
      return mode.value === "unknown" ? undefined : STATUS_TEXT_ID;
    });

    const platforms = computed(() =>
      PLATFORMS.map((p) => ({ ...p, url: installerUrl(LAUNCHER_UPDATE_URL, p.id, linkSource.value) }))
    );

    // Offers the source(s) the last download did not use. After an "auto" download
    // either source may have served it (detection timed out), so both are offered.
    const hints = computed(() => {
      const click = lastClick.value;
      if (!click) return [];
      const toChina = { target: "cn" as const, zh: ZH.hintGlobalSource(click.platform.label), showEnglish: false };
      const toGlobal = { target: "global" as const, zh: ZH.hintChinaSource, showEnglish: showEnglish.value };
      if (click.source === "auto") return [toChina, toGlobal];
      return click.source === "cn" ? [toGlobal] : [toChina];
    });

    // The switch the visitor activated is replaced by its counterpart, so focus
    // would fall to <body>; move it to the new one when asked to.
    async function choose(chosen: DownloadSource, keepFocus = false) {
      saved.value = nextSaved(detected.value, chosen);
      writeSavedSource(saved.value);
      if (keepFocus) await focusSwitch();
    }

    function onDownloadClick(platform: PlatformEntry) {
      lastClick.value = { platform, source: linkSource.value };
    }

    function onHintClick(target: DownloadSource) {
      const click = lastClick.value;
      if (!click) return;
      choose(target);
      lastClick.value = { platform: click.platform, source: target };
      window.open(installerUrl(LAUNCHER_UPDATE_URL, click.platform.id, target), "_blank", "noopener");
    }

    watch(() => tabsModel.value.self, (newVal) => {
      if (route.query.tabsModel !== newVal) {
        router.replace({
          query: {
            ...route.query,
            tabsModel: newVal
          }
        });
      }
    });

    return {
      tabsModel,
      ingameAddonLink,
      alertMessage,
      mdiDownload,
      noticeTextId: NOTICE_TEXT_ID,
      statusTextId: STATUS_TEXT_ID,
      describedBy,
      downloadArea,
      statusLabel,
      ZH,
      platforms,
      mode,
      source,
      showEnglish,
      hints,
      choose,
      onDownloadClick,
      onHintClick
    };
  },
});
</script>
<style lang="scss" scoped>
.download-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 599.98px) {
    flex-direction: column;

    .v-btn {
      width: 100%;
    }
  }
}

// Reserved so the section does not jump when detection answers.
.source-status {
  min-height: 3em;
}

.source-hint {
  min-height: 1.5em;
}

.source-switch {
  color: inherit;
  text-decoration: underline;
  text-align: left;
  cursor: pointer;
  // A 44 px tall target made of real padding: it takes up layout space, so it can
  // never overlap the text or controls around it (an absolutely positioned
  // pseudo-element did, and a stray tap could start a download).
  display: inline-block;
  padding-block: 12px;

  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
}

.v-tab--selected::after {
  opacity: 0.12 !important;
}

.video-container {
  position: relative;
  padding-bottom: 62.25%;
  height: 0;
  overflow: hidden;
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

code {
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: small;
}

.v-theme--human, .v-theme--orc {
  code {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.v-theme--nightelf, .v-theme--undead {
  code {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
