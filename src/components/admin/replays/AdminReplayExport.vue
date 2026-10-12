<template>
  <div class="replay-export">
    <v-card-title class="pt-3">Replay Export</v-card-title>
    <v-card-subtitle class="pb-1 text-wrap">
      Find games in the match history, check the list, and download their replays as one ZIP.
    </v-card-subtitle>

    <v-tabs
      v-model="tab"
      color="primary"
      class="tabs px-4 mt-2"
      density="compact"
      :grow="display.xs.value"
      :show-arrows="!display.xs.value"
    >
      <v-tab value="find" :prepend-icon="display.xs.value ? undefined : mdiMagnify">New download</v-tab>
      <v-tab value="history" :prepend-icon="display.xs.value ? undefined : mdiHistory">
        Past downloads
        <v-chip v-if="exports.length > 0" size="x-small" variant="tonal" class="tab-count">{{ exports.length }}</v-chip>
      </v-tab>
    </v-tabs>
    <v-divider />

    <!-- Above the tabs' content, so errors of both tabs show. -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mx-4 mt-4"
      closable
      @click:close="replayExportStore.error = ''"
    >
      {{ error }}
    </v-alert>

    <replay-past-downloads v-if="tab === 'history'" />

    <div v-show="tab === 'find'">
      <v-form class="filters px-4 py-4" @submit.prevent="findGames">
        <div class="sections">
          <v-sheet class="section" border rounded="lg">
            <div class="section-title">
              <v-icon :icon="mdiGamepadVariantOutline" size="18" />
              Games
            </div>
            <div class="fields">
              <v-select
                v-model="form.gameMode"
                :items="gameModes"
                label="Game mode"
                v-bind="field"
                @update:modelValue="onGameModeChange"
              />
              <v-select v-model="form.gateWay" :items="gateways" label="Gateway" v-bind="field" />
              <v-combobox
                v-model="form.mapName"
                :items="options?.mapNames ?? []"
                label="Map"
                placeholder="Any map"
                persistent-placeholder
                clearable
                v-bind="field"
              />
              <v-text-field
                v-model="form.battleTag"
                label="Player"
                placeholder="BattleTag#1234"
                persistent-placeholder
                clearable
                v-bind="field"
              />
            </div>
            <div class="section-hint">
              <v-icon :icon="mdiInformationOutline" size="14" />
              Only games played through FLO have a replay. The page lists no other games.
            </div>
          </v-sheet>

          <v-sheet class="section" border rounded="lg">
            <div class="section-title">
              <v-icon :icon="mdiCalendarRange" size="18" />
              Period
              <span class="section-note">UTC</span>
            </div>
            <div class="fields">
              <v-select
                v-model="form.seasons"
                :items="seasonItems"
                label="Seasons"
                placeholder="Any season"
                persistent-placeholder
                multiple
                clearable
                v-bind="field"
              >
                <template v-slot:selection="{ index }">
                  <span v-if="index === 0" class="text-truncate">{{ seasonsText(form.seasons) }}</span>
                </template>
              </v-select>
              <v-select v-model="form.patch" :items="patchItems" item-props label="Patch" v-bind="field" />
              <v-text-field v-model="form.dateFrom" type="date" label="From" clearable v-bind="field" />
              <v-text-field v-model="form.dateTo" type="date" label="To (inclusive)" clearable v-bind="field" />
            </div>
            <div class="section-hint">
              <v-icon :icon="mdiInformationOutline" size="14" />
              Season, patch and dates combine: a game must match all of them.
            </div>
          </v-sheet>

          <v-sheet class="section" border rounded="lg">
            <div class="section-title">
              <v-icon :icon="mdiChartBellCurveCumulative" size="18" />
              MMR
              <span class="section-note">before the game</span>
            </div>
            <v-range-slider
              v-model="form.mmrRange"
              class="mmr-slider"
              :min="0"
              :max="MMR_SLIDER_MAX"
              :step="25"
              :ticks="mmrTicks"
              show-ticks="always"
              tick-size="3"
              color="primary"
              track-size="3"
              thumb-size="16"
              strict
              hide-details
            />
            <div class="fields">
              <v-text-field
                v-model="mmrText.min"
                label="Min MMR"
                placeholder="No limit"
                persistent-placeholder
                type="number"
                min="0"
                :max="MMR_SLIDER_MAX"
                v-bind="field"
                @blur="commitMmr"
                @keydown.enter="commitMmr"
              />
              <v-text-field
                v-model="mmrText.max"
                label="Max MMR"
                placeholder="No limit"
                persistent-placeholder
                type="number"
                min="0"
                :max="MMR_SLIDER_MAX"
                v-bind="field"
                @blur="commitMmr"
                @keydown.enter="commitMmr"
              />
              <v-btn-toggle
                v-model="form.mmrMode"
                class="wide toggle"
                mandatory
                density="compact"
                color="primary"
                variant="outlined"
                divided
              >
                <v-btn :value="EReplayExportMmrMode.EveryPlayer">All players</v-btn>
                <v-btn :value="EReplayExportMmrMode.AnyPlayer">Any player</v-btn>
              </v-btn-toggle>
            </div>
            <div class="section-hint">
              <v-icon :icon="mdiInformationOutline" size="14" />
              {{ mmrModeHint }}
            </div>
          </v-sheet>

          <v-sheet class="section" border rounded="lg">
            <div class="section-title">
              <v-icon :icon="mdiSwordCross" size="18" />
              Matchup and length
            </div>
            <div class="fields">
              <v-select
                v-model="form.race"
                :items="races"
                :label="isOneVsOne ? 'Race' : 'Race (any player)'"
                v-bind="field"
              >
                <template v-slot:selection="{ item }">
                  <span v-if="item.raw.value !== null" class="race mr-2"><race-icon :key="item.raw.value" :race="item.raw.value" /></span>
                  {{ item.title }}
                </template>
                <template v-slot:item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template v-if="item.raw.value !== null" v-slot:prepend>
                      <span class="race mr-3"><race-icon :race="item.raw.value" /></span>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
              <v-select v-if="isOneVsOne" v-model="form.opponentRace" :items="races" label="vs race" v-bind="field">
                <template v-slot:selection="{ item }">
                  <span v-if="item.raw.value !== null" class="race mr-2"><race-icon :key="item.raw.value" :race="item.raw.value" /></span>
                  {{ item.title }}
                </template>
                <template v-slot:item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template v-if="item.raw.value !== null" v-slot:prepend>
                      <span class="race mr-3"><race-icon :race="item.raw.value" /></span>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
              <v-text-field
                v-model.number="form.minDurationMinutes"
                label="Min length"
                placeholder="No limit"
                persistent-placeholder
                suffix="min"
                type="number"
                min="0"
                clearable
                v-bind="field"
              />
              <v-text-field
                v-model.number="form.maxDurationMinutes"
                label="Max length"
                placeholder="No limit"
                persistent-placeholder
                suffix="min"
                type="number"
                min="0"
                clearable
                v-bind="field"
              />
            </div>
            <div class="section-hint">
              <v-icon :icon="mdiInformationOutline" size="14" />
              A random player counts as the race that they played.
            </div>
          </v-sheet>

          <v-sheet class="section full-row" border rounded="lg">
            <div class="section-title">
              <v-icon :icon="mdiHistory" size="18" />
              Past downloads
              <span class="section-note">only yours</span>
            </div>
            <div class="past-downloads">
              <v-switch
                v-model="form.excludePastDownloads"
                color="primary"
                inset
                density="compact"
                hide-details
                label="Exclude games that I downloaded before"
              />
              <v-select
                v-model="form.excludeExportIds"
                class="past-downloads-select"
                :items="exportItems"
                item-props
                multiple
                clearable
                :disabled="!form.excludePastDownloads"
                label="Downloads to exclude"
                placeholder="All my past downloads"
                persistent-placeholder
                no-data-text="No past downloads yet"
                v-bind="field"
                @update:menu="(open: boolean) => open && replayExportStore.loadExports()"
              >
                <template v-slot:selection="{ index }">
                  <span v-if="index === 0" class="text-truncate">{{ excludedDownloadsText }}</span>
                </template>
              </v-select>
            </div>
            <div class="section-hint">
              <v-icon :icon="mdiInformationOutline" size="14" />
              Leaves out every game whose replay was in one of your finished downloads, so you do not get the same
              replay twice.
            </div>
          </v-sheet>
        </div>

        <v-sheet class="action-bar mt-4" border rounded="lg">
          <div class="summary">
            <span class="summary-label">Selection</span>
            <v-chip size="small" variant="flat" color="primary">{{ gameModeName }}</v-chip>
            <v-chip
              v-for="filter in chips"
              :key="filter.key"
              size="small"
              variant="tonal"
              closable
              :close-label="`Remove ${filter.text}`"
              @click:close="clearFilter(form, filter.key)"
            >
              {{ filter.text }}
            </v-chip>
            <span v-if="chips.length === 0" class="text-caption text-medium-emphasis">
              All replayable games of this mode
            </span>
            <v-btn class="reset" variant="text" size="small" :prepend-icon="mdiRestore" @click="resetForm">Reset all</v-btn>
          </div>
          <v-divider />
          <div class="controls">
            <v-text-field
              v-model.number="form.maxGames"
              class="max-games"
              label="Max games"
              :placeholder="`All (up to ${maxQuantity.toLocaleString('en-US')})`"
              persistent-placeholder
              type="number"
              min="1"
              :max="maxQuantity"
              clearable
              :rules="[maxGamesRule]"
              v-bind="field"
            />
            <v-btn-toggle
              v-model="form.order"
              class="order toggle"
              mandatory
              density="compact"
              color="primary"
              variant="outlined"
              divided
            >
              <v-btn :value="EReplayExportOrder.Newest">Newest</v-btn>
              <v-btn :value="EReplayExportOrder.Oldest">Oldest</v-btn>
              <v-btn :value="EReplayExportOrder.Random">Random</v-btn>
            </v-btn-toggle>
            <v-btn
              class="find"
              type="submit"
              color="primary"
              variant="flat"
              :prepend-icon="mdiMagnify"
              :loading="loading"
              :disabled="maxGamesRule(form.maxGames) !== true"
            >
              Find games
            </v-btn>
          </div>
          <div class="section-hint order-hint">
            <v-icon :icon="mdiInformationOutline" size="14" />
            {{ orderHint }}
          </div>
        </v-sheet>
      </v-form>

      <div class="px-4 pb-4">
        <v-sheet v-if="!preview" class="empty-state" border rounded="lg">
          <v-progress-circular v-if="loading" indeterminate color="primary" />
          <template v-else>
            <v-icon :icon="mdiFilmstripBoxMultiple" size="40" class="mb-2" />
            <div class="text-subtitle-1">Set the filters and select Find games.</div>
            <div class="text-body-2 text-medium-emphasis">You can check every game before you download.</div>
          </template>
        </v-sheet>

        <v-sheet v-else class="results" border rounded="lg">
          <div class="results-header">
            <div>
              <div class="results-count">
                {{ preview.totalMatching.toLocaleString("en-US") }}{{ preview.totalIsCapped ? "+" : "" }}
                <span>{{ preview.totalMatching === 1 ? "game matches" : "games match" }}</span>
              </div>
              <div v-if="listedIds.length > 0" class="selection-line">
                <span>{{ listedIds.length.toLocaleString("en-US") }} listed ({{ orderLabel }})</span>
                <span aria-hidden="true">·</span>
                <span :class="{ 'text-high-emphasis': !allSelected }">{{ selectionText }}</span>
                <button type="button" class="link-action" @click="toggleSelectAll">
                  {{ allSelected ? "Clear selection" : `Select all ${listedIds.length.toLocaleString("en-US")}` }}
                </button>
              </div>
              <div v-if="moreThanListed" class="selection-line">
                One download has at most {{ maxQuantity.toLocaleString("en-US") }} replays. Select Exclude past downloads to get
                the next ones.
              </div>
            </div>
            <div v-if="listedIds.length > 0" class="download">
              <div class="download-row">
                <v-text-field
                  v-model="downloadName"
                  class="download-name"
                  label="Name (optional)"
                  placeholder="Example: UD mirrors, S23"
                  persistent-placeholder
                  maxlength="100"
                  v-bind="field"
                />
                <div v-if="prices && quote" class="price">
                  <div class="price-line">
                    <span class="price-total" :class="{ waived: prices.free && quote.total > 0 }">
                      {{ formatPrice(quote.total, prices.currency) }}
                    </span>
                    <v-chip
                      v-if="prices.free && quote.total > 0"
                      class="price-chip"
                      size="x-small"
                      color="success"
                      variant="tonal"
                      label
                    >
                      Free for admins
                    </v-chip>
                  </div>
                  <div class="price-detail">{{ quoteDetail(quote, prices) }}</div>
                </div>
                <v-btn
                  color="primary"
                  variant="flat"
                  :prepend-icon="mdiDownload"
                  :disabled="selected.length === 0"
                  :loading="downloading"
                  @click="download"
                >
                  Download {{ selected.length.toLocaleString("en-US") }} {{ selected.length === 1 ? "replay" : "replays" }}
                </v-btn>
              </div>
              <div class="text-caption text-medium-emphasis">
                ZIP with the .w3g files, manifest.csv and manifest.json. When it is complete, it shows in Past downloads.
              </div>
            </div>
          </div>

          <v-alert
            v-if="isStale"
            type="info"
            variant="tonal"
            density="compact"
            class="mx-4 mb-3"
          >
            The filters changed after this search. Select Find games to update the list. The download uses the games in
            this list.
          </v-alert>

          <div v-if="listedIds.length === 0" class="empty-state pt-2">
            <div class="text-subtitle-1">No games match these filters.</div>
            <div class="text-body-2 text-medium-emphasis">
              Remove a filter in the selection above. Season, patch and dates must all match.
            </div>
          </div>

          <!-- Only the page on the screen is loaded; the selection holds the ids of all pages. -->
          <v-data-table-server
            v-else
            v-model="selected"
            v-model:page="page"
            v-model:items-per-page="itemsPerPage"
            :headers="headers"
            :items="pageItems"
            :items-length="listedIds.length"
            :loading="loading || pageLoading"
            item-value="id"
            show-select
            density="compact"
            mobile-breakpoint="sm"
            :hide-default-header="display.xs.value"
            :items-per-page-options="[25, 50, 100, 250]"
            :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
            class="results-table"
          >
            <!-- Select all: every listed game, on all pages. -->
            <template v-slot:[`header.data-table-select`]>
              <v-checkbox-btn
                :model-value="allSelected"
                :indeterminate="selected.length > 0 && !allSelected"
                density="compact"
                aria-label="Select all listed games"
                @update:modelValue="toggleSelectAll"
              />
            </template>
            <template v-if="pageFailed" v-slot:no-data>
              <div class="page-failed">
                The games of this page did not load.
                <v-btn variant="text" size="small" color="primary" @click="loadPage(pageIds)">Retry</v-btn>
              </div>
            </template>
            <template v-slot:[`header.players`]="{ column }">
              {{ column.title }}
              <v-tooltip location="top" text="MMR before the game. The trophy marks the winner.">
                <template v-slot:activator="{ props: tooltipProps }">
                  <v-icon v-bind="tooltipProps" :icon="mdiInformationOutline" size="14" class="ml-1" />
                </template>
              </v-tooltip>
            </template>
            <!-- Phones: one compact card per game instead of one line per column. -->
            <template v-if="display.xs.value" v-slot:item="{ item, internalItem, isSelected, toggleSelect }">
              <tr class="mobile-row">
                <td :colspan="headers.length + 1">
                  <div class="mobile-game">
                    <v-checkbox-btn
                      :model-value="isSelected(internalItem)"
                      density="compact"
                      :aria-label="`Select the game of ${formatUtcMinute(item.endTime)}`"
                      @update:modelValue="toggleSelect(internalItem)"
                    />
                    <div class="mobile-game-body">
                      <div class="mobile-game-top">
                        <span>{{ formatUtcMinute(item.endTime) }} UTC</span>
                        <v-chip v-if="item.patch" size="x-small" variant="tonal" color="primary">{{ item.patch }}</v-chip>
                      </div>
                      <div class="players">
                        <span v-for="(team, teamIndex) in item.teams" :key="teamIndex" class="team">
                          <span v-for="player in team.players" :key="`${item.id}-${player.battleTag}`" class="player">
                            <span class="race"><race-icon :race="playedRace(player)" /></span>
                            <span :class="{ 'font-weight-bold': player.won }">{{ player.battleTag.split("#")[0] }}</span>
                            <v-icon v-if="player.won" :icon="mdiTrophy" size="14" class="winner" />
                            <span class="mmr">{{ player.oldMmr ?? "?" }}</span>
                          </span>
                        </span>
                      </div>
                      <div class="mobile-game-meta">
                        {{ item.mapName ?? item.map }} · {{ formatDuration(item.durationInSeconds) }}
                        <template v-if="item.averageMmr">· avg {{ item.averageMmr }}</template>
                      </div>
                    </div>
                    <v-btn
                      :to="{ name: EMainRouteName.MATCH, params: { matchId: item.id } }"
                      target="_blank"
                      size="small"
                      variant="text"
                      :icon="mdiOpenInNew"
                      title="Open the match page"
                    />
                  </div>
                </td>
              </tr>
            </template>
            <template v-slot:[`item.endTime`]="{ item }">
              <span class="when">
                <span>{{ formatUtcMinute(item.endTime).slice(0, 10) }}</span>
                <span class="time">{{ formatUtcMinute(item.endTime).slice(11) }}</span>
              </span>
            </template>
            <template v-slot:[`item.patch`]="{ item }">
              <v-chip v-if="item.patch" size="small" variant="tonal" color="primary">{{ item.patch }}</v-chip>
            </template>
            <template v-slot:[`item.mapName`]="{ item }">
              {{ item.mapName ?? item.map }}
            </template>
            <template v-slot:[`item.players`]="{ item }">
              <div class="players">
                <template v-for="(team, teamIndex) in item.teams" :key="teamIndex">
                  <span v-if="teamIndex > 0" class="versus">vs</span>
                  <span class="team">
                    <span v-for="player in team.players" :key="`${item.id}-${player.battleTag}`" class="player">
                      <span class="race"><race-icon :race="playedRace(player)" /></span>
                      <span :class="{ 'font-weight-bold': player.won }">{{ player.battleTag.split("#")[0] }}</span>
                      <v-icon v-if="player.won" :icon="mdiTrophy" size="14" class="winner" />
                      <span class="mmr">{{ player.oldMmr ?? "?" }}</span>
                    </span>
                  </span>
                </template>
              </div>
            </template>
            <template v-slot:[`item.durationInSeconds`]="{ item }">
              {{ formatDuration(item.durationInSeconds) }}
            </template>
            <template v-slot:[`item.actions`]="{ item }">
              <v-btn
                :to="{ name: EMainRouteName.MATCH, params: { matchId: item.id } }"
                target="_blank"
                size="small"
                variant="text"
                :icon="mdiOpenInNew"
                title="Open the match page"
              />
            </template>
          </v-data-table-server>
        </v-sheet>
      </div>
    </div>

    <v-snackbar v-model="downloadStarted" color="success" :timeout="8000">
      {{ downloadStartedText }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useDisplay } from "vuetify";
import {
  mdiCalendarRange,
  mdiChartBellCurveCumulative,
  mdiDownload,
  mdiFilmstripBoxMultiple,
  mdiGamepadVariantOutline,
  mdiHistory,
  mdiInformationOutline,
  mdiMagnify,
  mdiOpenInNew,
  mdiRestore,
  mdiSwordCross,
  mdiTrophy,
} from "@mdi/js";
import RaceIcon from "@/components/player/RaceIcon.vue";
import ReplayPastDownloads from "@/components/admin/replays/ReplayPastDownloads.vue";
import { EMainRouteName } from "@/router/types";
import { EGameMode, ERaceEnum } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import { useReplayExportStore } from "@/store/admin/replayExport/store";
import { formatPrice, quoteDetail, quoteReplays } from "@/store/admin/replayExport/pricing";
import { EReplayExportMmrMode, EReplayExportOrder, ReplayExportForm, ReplayExportMatch } from "@/store/admin/replayExport/types";
import {
  activeFilters,
  clearFilter,
  defaultReplayExportForm,
  describeSelection,
  exportTitle,
  formatDay,
  formatDuration,
  formatUtcMinute,
  MMR_SLIDER_MAX,
  orderText,
  ONE_VS_ONE_MODES,
  parseMmrRange,
  patchPeriods,
  playedRace,
  seasonsText,
  toReplayExportFilter,
} from "@/store/admin/replayExport/filters";

/** The same look for every input on the page. */
const field = { variant: "outlined", density: "compact", color: "primary", hideDetails: "auto" } as const;

const mmrTicks = { 0: "0", 1000: "1000", 2000: "2000", [MMR_SLIDER_MAX]: `${MMR_SLIDER_MAX}+` };

const i18n = useI18n();
const display = useDisplay();
const replayExportStore = useReplayExportStore();

const form = reactive<ReplayExportForm>(defaultReplayExportForm());
const mmrText = reactive({ min: "", max: "" });
const selected = ref<string[]>([]);
const downloading = ref(false);
const downloadStarted = ref(false);
const downloadName = ref("");
const tab = ref<"find" | "history">("find");
const downloadStartedText = ref("");

const options = computed(() => replayExportStore.options);
const preview = computed(() => replayExportStore.preview);
const loading = computed(() => replayExportStore.loading);
const error = computed(() => replayExportStore.error);
const maxQuantity = computed(() => options.value?.maxQuantity ?? 5000);
const isOneVsOne = computed(() => ONE_VS_ONE_MODES.includes(form.gameMode));

const gameModes = Object.values(EGameMode)
  .filter((mode): mode is EGameMode => typeof mode === "number" && mode !== EGameMode.UNDEFINED)
  .map((mode) => {
    const key = `gameModes.${EGameMode[mode]}`;
    return { title: i18n.te(key) ? i18n.t(key) : EGameMode[mode], value: mode };
  });

const gameModeName = computed(() => gameModes.find((mode) => mode.value === form.gameMode)?.title ?? "");

const seasonItems = computed(() => (options.value?.seasons ?? []).map((season) => ({ title: `Season ${season}`, value: season })));

const exports = computed(() => replayExportStore.exports);

const exportItems = computed(() =>
  exports.value.map((e) => ({
    title: exportTitle(e),
    value: e.id,
    subtitle: `${formatDay(e.createdAt)} · ${e.count.toLocaleString("en-US")} replays${e.description ? ` · ${e.description}` : ""}`,
  }))
);

const excludedDownloadsText = computed(() => {
  const ids = form.excludeExportIds;
  if (ids.length !== 1) return `${ids.length} downloads`;
  const only = exports.value.find((e) => e.id === ids[0]);
  return only ? exportTitle(only) : "1 download";
});

const patchItems = computed(() => [
  { title: "Any patch", value: null },
  ...(options.value?.patches ?? []).map((patch) => ({ title: patch.version, value: patch.version, subtitle: patchPeriods(patch) })),
]);

const gateways = [
  { title: "Any gateway", value: null },
  { title: "Europe", value: Gateways.Europe },
  { title: "America", value: Gateways.America },
];

const raceName = (race: ERaceEnum) => i18n.t(`races.${ERaceEnum[race]}`);

const races = [
  { title: "Any race", value: null },
  ...[ERaceEnum.HUMAN, ERaceEnum.ORC, ERaceEnum.NIGHT_ELF, ERaceEnum.UNDEAD, ERaceEnum.RANDOM].map((race) => ({
    title: raceName(race),
    value: race,
  })),
];

const chips = computed(() => activeFilters(form, raceName));

const mmrModeHint = computed(() =>
  form.mmrMode === EReplayExportMmrMode.EveryPlayer
    ? "All players: every player in the game is in the range."
    : "Any player: at least one player in the game is in the range."
);

const prices = computed(() => options.value?.prices ?? null);

/** The ids of all listed games. Select all and Download use them; the table loads the games page by page. */
const listedIds = computed(() => replayExportStore.preview?.matchIds ?? []);

const page = ref(1);
const itemsPerPage = ref(25);

const pageIds = computed(() => listedIds.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value));

const pageItems = computed(() =>
  pageIds.value.map((id) => replayExportStore.matchesById[id]).filter((match): match is ReplayExportMatch => !!match)
);

/** True when the games of the page on the screen did not load. The table then offers Retry. */
const pageFailed = ref(false);

const pageLoading = computed(
  () => replayExportStore.pagesLoading > 0 || (!pageFailed.value && pageIds.value.some((id) => !(id in replayExportStore.matchesById)))
);

async function loadPage(ids: string[]) {
  pageFailed.value = false;
  const loaded = await replayExportStore.loadMatches(ids);
  // Only for the page that is still on the screen.
  if (ids === pageIds.value) pageFailed.value = !loaded;
}

watch(pageIds, loadPage);

// A new list starts on page 1, with all its games selected. Sync, so the page loader never gets the page
// number of the old list. A failed search keeps the old list, and its selection.
watch(
  () => replayExportStore.preview,
  () => {
    page.value = 1;
    selected.value = [...listedIds.value];
  },
  { flush: "sync" }
);

// A game that is gone since the search leaves the list (see loadMatches), and so the selection.
watch(listedIds, (ids) => {
  const listed = new Set(ids);
  if (selected.value.some((id) => !listed.has(id))) selected.value = selected.value.filter((id) => listed.has(id));
});

/** The list is full at the limit of one download, and more games match: the order selected which ones. */
const moreThanListed = computed(() => {
  const shown = preview.value;
  const listed = shown?.matchIds.length ?? 0;
  return !!shown && listed >= maxQuantity.value && (shown.totalMatching > listed || shown.totalIsCapped);
});

/** Every listed game is selected: on all pages of the list, not only the page on the screen. */
const allSelected = computed(() => listedIds.value.length > 0 && selected.value.length === listedIds.value.length);

const selectionText = computed(() => {
  const count = selected.value.length.toLocaleString("en-US");
  if (allSelected.value) return listedIds.value.length === 1 ? "selected" : `all ${count} selected`;
  return `${count} of ${listedIds.value.length.toLocaleString("en-US")} selected`;
});

function toggleSelectAll() {
  selected.value = allSelected.value ? [] : [...listedIds.value];
}

/** The price of the selected replays. It changes when the user selects or clears games in the list. */
const quote = computed(() => (prices.value ? quoteReplays(selected.value.length, prices.value) : null));

const orderLabel = computed(() => orderText(replayExportStore.previewFilter?.order ?? EReplayExportOrder.Newest));

/** Empty means all games found, up to the limit of one download. */
const maxGamesRule = (value: number | string | null) => {
  if (value === null || `${value}` === "") return true;
  const max = Number(value);
  return (Number.isInteger(max) && max >= 1 && max <= maxQuantity.value) || `1 – ${maxQuantity.value.toLocaleString("en-US")}`;
};

/** Which games the list gets when more match than it takes. */
const orderHint = computed(() => {
  const most = (Number(form.maxGames) || maxQuantity.value).toLocaleString("en-US");
  if (form.order === EReplayExportOrder.Random) return `When more than ${most} games match, the list gets ${most} random games from the newest 100,000.`;
  return `When more than ${most} games match, the list gets the ${form.order === EReplayExportOrder.Oldest ? "oldest" : "newest"} ${most}.`;
});

/** True when the list does not show the result of the current filters. */
const isStale = computed(() => {
  const shown = replayExportStore.previewFilter;
  return !!shown && JSON.stringify(shown) !== JSON.stringify(toReplayExportFilter(form));
});

/**
 * Season and FLO ID only fit on wide screens; both are also in the manifest. No column sorts: the server
 * gives the pages in the order of the search.
 */
const headers = computed(() => [
  { title: "Ended (UTC)", key: "endTime", sortable: false, nowrap: true },
  ...(display.lgAndUp.value ? [{ title: "Season", key: "season", sortable: false, align: "end" as const, nowrap: true }] : []),
  { title: "Patch", key: "patch", sortable: false },
  { title: "Map", key: "mapName", sortable: false },
  { title: "Players", key: "players", sortable: false, nowrap: true },
  { title: "Avg MMR", key: "averageMmr", sortable: false, align: "end" as const, nowrap: display.lgAndUp.value },
  { title: "Length", key: "durationInSeconds", sortable: false, align: "end" as const, nowrap: true },
  ...(display.xlAndUp.value ? [{ title: "FLO ID", key: "floMatchId", sortable: false, align: "end" as const, nowrap: true }] : []),
  { title: "", key: "actions", sortable: false, width: 44 },
]);

watch(
  () => [...form.mmrRange],
  ([min, max]) => {
    mmrText.min = min <= 0 ? "" : String(min);
    mmrText.max = max >= MMR_SLIDER_MAX ? "" : String(max);
  },
  { immediate: true }
);

/** The number fields change the range when they lose focus, so a half-typed value does not move the slider. */
function commitMmr() {
  const range = parseMmrRange(mmrText.min, mmrText.max);
  if (range) form.mmrRange = range;
  // Show the clamped and ordered values, also when the range did not change.
  mmrText.min = form.mmrRange[0] <= 0 ? "" : String(form.mmrRange[0]);
  mmrText.max = form.mmrRange[1] >= MMR_SLIDER_MAX ? "" : String(form.mmrRange[1]);
}

function onGameModeChange() {
  form.mapName = null;
  if (!isOneVsOne.value) form.opponentRace = null;
  replayExportStore.loadOptions(form.gameMode);
}

function resetForm() {
  Object.assign(form, defaultReplayExportForm());
  replayExportStore.loadOptions(form.gameMode);
}

async function findGames() {
  // Enter in a field submits the form also while the button shows that it loads.
  if (loading.value) return;
  commitMmr();
  if (maxGamesRule(form.maxGames) !== true) return;
  await replayExportStore.loadPreview(toReplayExportFilter(form), describeSelection(gameModeName.value, chips.value, form.order));
}

async function download() {
  downloading.value = true;
  try {
    const ticket = await replayExportStore.download(selected.value, downloadName.value);
    if (!ticket) return;
    const price = `${formatPrice(ticket.price, prices.value?.currency ?? "USD")}${ticket.charged ? "" : ", free for admins"}`;
    downloadStartedText.value = `Download started: ${ticket.count.toLocaleString("en-US")} replays (${price}). Your browser saves the ZIP while it streams.`;
    downloadStarted.value = true;
  } finally {
    downloading.value = false;
  }
}

onMounted(() => {
  replayExportStore.error = "";
  replayExportStore.loadOptions(form.gameMode);
  replayExportStore.loadExports();
});

// The form starts empty on the next visit, so the list of this visit must go too.
onUnmounted(() => replayExportStore.clearSearch());
</script>

<style scoped>
.filters {
  container: filters / inline-size;
}

.tab-count {
  margin-left: 8px;
}

/* Phones: both tabs fit on one line. */
@media (max-width: 599px) {
  .tabs :deep(.v-tab) {
    padding: 0 8px;
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
  }

  .tab-count {
    margin-left: 6px;
  }
}

/* Four sections: one column, or a 2 × 2 grid when there is room. Never 3 + 1. */
.sections {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr);
}

@container filters (min-width: 900px) {
  .sections {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.section {
  container-type: inline-size;
  padding: 14px 16px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.section-note {
  font-weight: 400;
  letter-spacing: normal;
  text-transform: none;
}

.section-note::before {
  content: "·";
  margin-right: 8px;
}

.section-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.order-hint {
  margin-top: 0;
  padding: 0 16px 12px;
}

.fields {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr);
}

.fields .wide {
  grid-column: 1 / -1;
}

@container (min-width: 360px) {
  .fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (min-width: 720px) {
  .fields {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .fields .wide {
    grid-column: span 2;
  }
}

.mmr-slider {
  margin: 0 6px 26px;
}

.mmr-slider :deep(.v-slider-track__tick-label) {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.toggle {
  height: 40px;
}

.full-row {
  grid-column: 1 / -1;
}

.past-downloads {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 24px;
}

.past-downloads-select {
  flex: 1 1 320px;
  max-width: 560px;
}

.download-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}

.download-name {
  flex: 0 0 280px;
}

.download-row .v-btn {
  height: 40px;
}

/* The price of the selected replays, next to the Download button. Two lines in the 40px row. */
.price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  height: 40px;
  padding: 0 4px 0 16px;
  border-left: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.price-line {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 22px;
}

.price-total {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 22px;
  font-variant-numeric: tabular-nums;
}

/* Admins see the price, but do not pay it. */
.price-total.waived {
  font-weight: 600;
  text-decoration: line-through;
  text-decoration-thickness: 1.5px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.price-chip {
  font-weight: 600;
}

.price-detail {
  font-size: 0.75rem;
  line-height: 16px;
  white-space: nowrap;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.toggle .v-btn {
  flex: 1 1 0;
}

.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

.summary-label {
  margin-right: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px 16px;
  padding: 12px 16px;
}

.order .v-btn {
  min-width: 96px;
}

.reset {
  margin-left: auto;
}

.find {
  height: 40px;
  margin-left: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 180px;
  padding: 24px 16px;
  text-align: center;
  color: rgba(var(--v-theme-on-surface), var(--v-high-emphasis-opacity));
}

.empty-state .v-icon {
  opacity: 0.5;
}

.results {
  overflow: hidden;
}

.results-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 24px;
  padding: 16px;
}

.results-count {
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.2;
}

.selection-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 6px;
  margin-top: 2px;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.max-games {
  flex: 0 0 190px;
}

.page-failed {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 8px;
  padding: 16px 0;
}

.link-action {
  margin-left: 4px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
}

.link-action:hover,
.link-action:focus-visible {
  text-decoration: underline;
}

.results-count span {
  font-size: 1rem;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Stays on the right, also when it wraps below the count. */
.download {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: auto;
}

.results-table {
  background: transparent;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.results-table :deep(th),
.results-table :deep(td) {
  padding: 0 8px !important;
}

.results-table :deep(tr > :first-child) {
  padding-left: 12px !important;
}

.when {
  white-space: nowrap;
}

.mobile-row > td {
  display: block !important;
  height: auto !important;
  padding: 10px 4px 10px 0 !important;
}

.mobile-game {
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.mobile-game-body {
  flex: 1 1 auto;
  min-width: 0;
}

.mobile-game-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
  font-weight: 600;
}

.mobile-game-meta {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.when .time {
  margin-left: 6px;
}

.players {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px 8px;
  padding: 4px 0;
}

.team {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 2px 12px;
}

.player {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.versus,
.mmr {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.winner {
  color: #c99a06;
}

.race {
  display: inline-flex;
}

.race :deep(.race-icon) {
  height: 18px;
}

/* Below 1280px the table gets narrow: teams and the date and time go on separate lines. */
@media (max-width: 1279px) {
  .players {
    flex-direction: column;
    align-items: flex-start;
  }

  .versus {
    display: none;
  }

  .when .time {
    display: block;
    margin-left: 0;
    color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  }
}

@media (max-width: 599px) {
  .max-games,
  .order,
  .find {
    flex: 1 1 100%;
  }

  .find {
    margin-left: 0;
  }

  .download {
    width: 100%;
    align-items: stretch;
    text-align: center;
  }

  .download-name,
  .download-row .v-btn,
  .price {
    flex: 1 1 100%;
  }

  .price {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 4px 8px;
    height: auto;
    padding: 8px 12px;
    border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
    border-radius: 4px;
  }
}
</style>
