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
                  <v-card-text class="download-area pa-0">
                    <fieldset class="source-list">
                      <legend class="source-legend text-body-2">{{ $t("components_launchersetup.label") }}</legend>
                      <!-- While detection answers, a veil covers the laid-out list so nothing moves when it lifts. -->
                      <div class="source-box">
                        <div
                          class="source-options"
                          :class="{ 'source-options--pending': detecting }"
                          :inert="detecting || undefined"
                          :aria-busy="detecting ? 'true' : undefined"
                        >
                          <label
                            v-for="(option, index) in options"
                            :key="option.key"
                            class="source-option"
                            :class="{ 'source-option--checked': option.checked }"
                            :data-source="option.key"
                          >
                            <input
                              type="radio"
                              name="launcher-download-source"
                              :value="option.key"
                              :checked="option.checked"
                              @change="choose(option.key)"
                            />
                            <span class="source-text">
                              <span :id="option.nameId" class="source-name">
                                {{ option.name }}<template v-if="option.nameZh"><span aria-hidden="true"> · </span><span lang="zh-CN">{{ option.nameZh }}</span></template>
                              </span>
                              <span class="source-desc text-medium-emphasis">
                                {{ option.desc }}<template v-if="option.descZh">{{ " " }}<span lang="zh-CN">{{ option.descZh }}</span></template>
                              </span>
                            </span>
                            <!-- The recommended source is always first, so the first row always holds the badge's space. -->
                            <span
                              v-if="index === 0"
                              class="source-badge"
                              :class="{ 'source-badge--reserved': !option.recommended }"
                              :aria-hidden="option.recommended ? undefined : 'true'"
                            >{{ $t("components_launchersetup.recommended") }}</span>
                          </label>
                        </div>
                        <Transition name="source-veil">
                          <div v-if="detecting" class="source-veil text-body-2" role="status">
                            <v-progress-circular indeterminate size="20" width="2" color="primary" aria-hidden="true" />
                            <span>{{ $t("components_launchersetup.detecting") }}</span>
                          </div>
                        </Transition>
                      </div>
                    </fieldset>

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

                    <div aria-live="polite" class="source-hint text-body-2 text-high-emphasis">
                      <button v-if="hint" type="button" class="source-hint-button" @click="onHintClick(hint.target)">
                        {{ hint.text }}<template v-if="hint.zh"><span aria-hidden="true"> · </span><span lang="zh-CN">{{ hint.zh }}</span></template>
                      </button>
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
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { LAUNCHER_UPDATE_URL } from "@/config/env";
import { mdiDownload } from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import LauncherDownloadSourceService from "@/services/LauncherDownloadSourceService";
import {
  chineseSupplement,
  type DetectedSource,
  type DownloadSource,
  effectiveSource,
  fallbackSource,
  installerUrl,
  type InstallerPlatform,
  type LinkSource,
  nextSaved,
  orderedSources,
  SUPPLEMENT_LOCALE,
} from "./launcherDownloadSource";
import { readDetectedSource, readSavedSource, writeDetectedSource, writeSavedSource } from "./launcherDownloadSourceStorage";

interface PlatformEntry {
  id: InstallerPlatform;
  label: string;
}

const PLATFORMS: PlatformEntry[] = [
  { id: "windows", label: "Windows" },
  { id: "mac-arm64", label: "macOS (Apple Silicon)" },
  { id: "mac-x64", label: "macOS (Intel)" },
];

const KEY_PREFIX = "components_launchersetup.";

/** The element the download buttons are described by: the checked source's name. */
function sourceNameId(source: DownloadSource): string {
  return `launcher-source-name-${source}`;
}

export default defineComponent({
  name: "LauncherSetup",
  components: {},
  setup() {
    const alertMessage = ref<string>("These steps are only needed if you have problems with the normal W3Champions App. In that case, please reach out on Discord!");
    const ingameAddonLink = ref<string>(LAUNCHER_UPDATE_URL + "ingame-addon");
    const route = useRoute();
    const router = useRouter();
    const { t } = useI18n();
    const tabsModel = ref({ self: (route.query.tabsModel as string) || "launcher" });

    // An answer from earlier in this browser session applies before the first render: no veil, no request.
    const remembered = readDetectedSource();
    // True until detection answers; `detected === null` afterwards means it could not tell.
    const detecting = ref(remembered === null);
    const detected = ref<DetectedSource | null>(null);
    const saved = ref<DownloadSource | null>(readSavedSource());
    // The last download the visitor started, and the source it came from.
    const lastClick = ref<{ platform: PlatformEntry; source: LinkSource } | null>(null);

    /** The site-language text, plus its Chinese rendering when that is different text. */
    function bilingual(key: string, named: Record<string, string> = {}, namedZh: Record<string, string> = named) {
      const text = t(KEY_PREFIX + key, named);
      return { text, zh: chineseSupplement(text, t(KEY_PREFIX + key, namedZh, { locale: SUPPLEMENT_LOCALE })) };
    }

    function applyDetected(answer: DetectedSource | null) {
      detected.value = answer;
      // A saved choice that equals what detection picks is no longer a choice.
      if (answer !== null && saved.value === answer) {
        saved.value = nextSaved(answer, saved.value);
        writeSavedSource(saved.value);
      }
    }

    if (remembered !== null) applyDetected(remembered);

    // The options are inert while detecting, so the reorder below can never move a focused radio.
    onMounted(async () => {
      if (!detecting.value) return;
      const answer = await LauncherDownloadSourceService.fetchDetected();
      if (answer !== null) writeDetectedSource(answer);
      applyDetected(answer);
      detecting.value = false;
    });

    const linkSource = computed(() => effectiveSource(detected.value, saved.value));

    const options = computed(() =>
      orderedSources(detected.value).map((key) => {
        // Only the China source gets a Chinese supplement: it is the one Chinese readers need to recognise.
        const name = key === "cn" ? bilingual("cn_name") : { text: t(`${KEY_PREFIX}${key}_name`), zh: null };
        const desc = key === "cn" ? bilingual("cn_desc") : { text: t(`${KEY_PREFIX}${key}_desc`), zh: null };
        return {
          key,
          nameId: sourceNameId(key),
          name: name.text,
          nameZh: name.zh,
          desc: desc.text,
          descZh: desc.zh,
          checked: linkSource.value === key,
          recommended: detected.value === key,
        };
      })
    );

    const describedBy = computed(() => (linkSource.value === "auto" ? undefined : sourceNameId(linkSource.value)));

    const platforms = computed(() =>
      PLATFORMS.map((p) => ({ ...p, url: installerUrl(LAUNCHER_UPDATE_URL, p.id, linkSource.value) }))
    );

    // After a download click: one suggestion, the next source in list order.
    const hint = computed(() => {
      const click = lastClick.value;
      if (!click) return null;
      const target = fallbackSource(click.source, detected.value);
      const nameKey = `${KEY_PREFIX}${target}_name`;
      const { text, zh } = bilingual(
        "hint_try",
        { source: t(nameKey) },
        { source: t(nameKey, {}, { locale: SUPPLEMENT_LOCALE }) },
      );
      const addChinese = detected.value === "cn" || target === "cn";
      return { target, text, zh: addChinese ? zh : null };
    });

    function choose(chosen: DownloadSource) {
      saved.value = nextSaved(detected.value, chosen);
      writeSavedSource(saved.value);
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
      describedBy,
      detecting,
      options,
      platforms,
      hint,
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

.source-list {
  margin: 0 0 20px;
  padding: 0;
  border: 0;
  min-width: 0;
}

.source-legend {
  margin-bottom: 8px;
  padding: 0;
  font-weight: 600;
}

.source-box {
  position: relative;
}

.source-options {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  overflow: hidden;
}

// Laid out as normal so the box keeps its final height; only the veil shows.
.source-options--pending > * {
  visibility: hidden;
}

.source-veil {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  text-align: center;
}

.source-veil-leave-active {
  transition: opacity 200ms ease-out;
}

.source-veil-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .source-veil-leave-active {
    transition: none;
  }
}

// Radio, text, badge; on narrow screens the badge drops below the text.
.source-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 6px 12px;
  min-height: 44px;
  padding: 10px 14px;
  cursor: pointer;

  & + & {
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  &:hover {
    background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
  }

  &:has(input:focus-visible) {
    outline: 2px solid rgb(var(--v-theme-primary));
    outline-offset: -2px;
  }

  input {
    width: 18px;
    height: 18px;
    margin: 2px 0 0;
    accent-color: rgb(var(--v-theme-primary));
    cursor: pointer;
  }

  @media (max-width: 599.98px) {
    grid-template-columns: auto minmax(0, 1fr);

    .source-badge {
      grid-column: 2;
      justify-self: start;
    }
  }
}

.source-option--checked {
  background: rgba(var(--v-theme-on-surface), var(--v-selected-opacity));
  box-shadow: inset 4px 0 0 rgb(var(--v-theme-primary));
}

.source-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-wrap: anywhere;
}

.source-name {
  font-weight: 600;
}

.source-desc {
  font-size: 0.8125rem;
  line-height: 1.45;
}

.source-badge {
  max-width: 100%;
  padding: 2px 10px;
  border-radius: 11px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  // The plain success green is too light for white 12 px text (2.8:1); this shade is 5.6:1.
  background: rgb(var(--v-theme-success-darken-2));
  color: rgb(var(--v-theme-on-success-darken-2));
}

// Holds the badge's space in the first row while there is no recommendation.
.source-badge--reserved {
  visibility: hidden;
}

.source-hint {
  margin-top: 8px;
}

.source-hint-button {
  min-height: 44px;
  padding-block: 10px;
  color: inherit;
  text-align: left;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;

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
