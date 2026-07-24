<template>
  <div>
    <v-autocomplete
      v-model="selected"
      v-model:search="input"
      v-model:menu="menuOpen"
      class="w3-autocomplete"
      :class="classes"
      menu-icon=""
      :append-inner-icon="mdiMagnify"
      :label="showFloatingLabel ? searchLabel : undefined"
      :placeholder="showFloatingLabel ? undefined : searchLabel"
      :persistent-placeholder="!showFloatingLabel"
      :single-line="!showFloatingLabel"
      :density="density"
      :items="searchedPlayers"
      item-title="battleTag"
      item-value="battleTag"
      :no-data-text="noDataText"
      :loading="isLoading"
      :autofocus="setAutofocus"
      bg-color="transparent"
      :hide-details="hideDetails"
      glow
      color="primary"
      icon-color="primary"
      variant="underlined"
      autocomplete="off"
      clearable
      @click:clear="clearSearch"
      @click:append-inner="submitSearch"
      @keydown.enter.prevent="submitSearch"
    >
      <template v-slot:item="{ props: itemProps, item }">
        <v-menu
          open-on-hover
          :open-on-click="false"
          :open-delay="150"
          :close-delay="50"
          location="start"
          :offset="4"
          @update:model-value="onHoverCardToggled($event, item.raw.battleTag)"
        >
          <template v-slot:activator="{ props: hoverProps }">
            <v-list-item v-bind="mergeProps(itemProps, hoverProps)">
              <template v-slot:prepend>
                <v-avatar rounded="0" size="26" class="mr-3">
                  <v-img :src="getAvatarUrlFor(item.raw.battleTag)" />
                </v-avatar>
              </template>
              <template v-slot:append>
                <span
                  v-if="getMaxMmrFor(item.raw.battleTag) > 0"
                  class="text-caption text-medium-emphasis ml-4 number-text"
                >
                  {{ getMaxMmrFor(item.raw.battleTag) }} MMR
                </span>
              </template>
            </v-list-item>
          </template>
          <player-search-info-card
            :battleTag="item.raw.battleTag"
            :enrichment="enrichments[item.raw.battleTag]"
          />
        </v-menu>
      </template>
    </v-autocomplete>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, mergeProps, ref, watch, PropType } from "vue";
import debounce from "debounce";
import ProfileService from "@/services/ProfileService";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import PlayerSearchInfoCard from "@/components/common/PlayerSearchInfoCard.vue";
import { PlayerSearchEnrichment, getMaxMmr, getSearchPlayerAvatarUrl } from "@/components/common/playerSearchEnrichment";
import { useRankingStore } from "@/store/ranking/store";
import { useRootStateStore } from "@/store/rootState/store";

import { mdiMagnify } from "@mdi/js";
import { ModeStat, PlayerProfile } from "@/store/player/types";

type SearchDensity = "default" | "comfortable" | "compact";

// Only enrich (and sort) the first results to avoid flooding the API with
// one game-mode-stats request per found player.
const MAX_ENRICHED_PLAYERS = 20;

export default defineComponent({
  name: "PlayerSearch",
  components: {
    PlayerSearchInfoCard,
  },
  props: {
    classes: {
      type: String,
      required: false,
      default: "",
    },
    setAutofocus: {
      type: Boolean,
      required: false,
      default: true,
    },
    hideDetails: {
      type: Boolean,
      required: false,
      default: true,
    },
    showFloatingLabel: {
      type: Boolean,
      required: false,
      default: true,
    },
    density: {
      type: String as PropType<SearchDensity>,
      required: false,
      default: "default",
    },
    searchLabel: {
      type: String,
      required: false,
      default: "Search BattleTag",
    }
  },
  setup: (props, context) => {
    const rankingStore = useRankingStore();
    const rootStateStore = useRootStateStore();
    const input = ref<string>("");
    const isLoading = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const debouncedSearch = debounce((val: string) => dispatchSearch(val), SEARCH_DELAY);
    const searchedPlayers = ref<PlayerProfile[]>([]);
    const selected = ref<string>();
    const menuOpen = ref<boolean>(false);
    const enrichments = ref<Record<string, PlayerSearchEnrichment>>({});
    let searchToken = 0;

    async function dispatchSearch(val: string) {
      const token = ++searchToken;
      const players = await ProfileService.searchPlayer(val.toLowerCase());
      if (token !== searchToken) return;
      searchedPlayers.value = players;
      isLoading.value = false;
      enrichPlayers(players, token);
    }

    async function getCurrentSeasonId(): Promise<number> {
      await rankingStore.retrieveSeasons();
      return rankingStore.seasons[0]?.id ?? -1;
    }

    async function fetchEnrichments(battleTags: string[]): Promise<void> {
      const newTags = battleTags.filter((tag) => !enrichments.value[tag]);
      if (newTags.length === 0) return;
      for (const tag of newTags) {
        enrichments.value[tag] = {};
      }

      const loadSettings = async () => {
        const settings = await PersonalSettingsService.retrievePersonalSettingSummaries(newTags);
        for (const setting of settings) {
          const enrichment = enrichments.value[setting.id];
          if (!enrichment) continue;
          enrichment.profilePicture = setting.profilePicture;
          enrichment.countryCode = setting.countryCode;
          enrichment.location = setting.location;
        }
      };

      const loadStats = async () => {
        const seasonId = await getCurrentSeasonId();
        await Promise.all(newTags.map(async (tag) => {
          let modeStats: ModeStat[] = [];
          try {
            const stats = await ProfileService.retrieveGameModeStats(tag, rootStateStore.gateway, seasonId);
            modeStats = (Array.isArray(stats) ? stats : [])
              .filter((stat) => stat.games > 0)
              .sort((a, b) => b.games - a.games);
          } catch {
            // Leave the stats empty, the hover card falls back to "no ranked games".
          }
          enrichments.value[tag].modeStats = modeStats;
          enrichments.value[tag].maxMmr = getMaxMmr(modeStats);
        }));
      };

      await Promise.allSettled([loadSettings(), loadStats()]);
    }

    async function enrichPlayers(players: PlayerProfile[], token: number): Promise<void> {
      await fetchEnrichments(players.slice(0, MAX_ENRICHED_PLAYERS).map((player) => player.battleTag));

      // Order the (still current) result list from best to worst player.
      if (token !== searchToken) return;
      searchedPlayers.value = [...searchedPlayers.value]
        .sort((a, b) => getMaxMmrFor(b.battleTag) - getMaxMmrFor(a.battleTag));
    }

    // Players beyond the prefetch cap get their data loaded when hovered.
    function onHoverCardToggled(opened: boolean, battleTag: string): void {
      if (!opened) return;
      fetchEnrichments([battleTag]);
    }

    function getAvatarUrlFor(battleTag: string): string {
      return getSearchPlayerAvatarUrl(battleTag, enrichments.value[battleTag]);
    }

    function getMaxMmrFor(battleTag: string): number {
      return enrichments.value[battleTag]?.maxMmr ?? 0;
    }

    watch(selected, onSelect);

    function onSelect(btag: string | undefined): void {
      if (!btag) return;
      menuOpen.value = false;
      context.emit("playerFound", btag);
    }

    function submitSearch(): void {
      const searchValue = (input.value || selected.value || "").trim();
      if (!searchValue) {
        clearSearch();
        return;
      }

      context.emit("searchRequested", searchValue);
    }

    watch(input, onInput);

    function onInput(val: string): void {
      if (!val || val.length < 3) {
        searchedPlayers.value = [];
        return;
      }
      // Selecting a player writes their battleTag back into the search field;
      // don't fire (and reopen) a new search for it.
      if (val === selected.value) return;
      isLoading.value = true;
      debouncedSearch(val);
    }

    const clearSearch = (): void => {
      context.emit("searchCleared");
      isLoading.value = false;
    };

    context.expose({
      selected
    });

    const noDataText = computed<string>(() =>
      (!input.value || input.value.length < 3)
        ? "Type at least 3 letters"
        : isLoading.value
          ? "Loading..."
          : "No player found");

    return {
      mdiMagnify,
      mergeProps,
      selected,
      menuOpen,
      input,
      noDataText,
      isLoading,
      searchedPlayers,
      enrichments,
      getAvatarUrlFor,
      getMaxMmrFor,
      onHoverCardToggled,
      clearSearch,
      submitSearch,
    };
  },
});
</script>
