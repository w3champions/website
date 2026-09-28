<template>
  <div>
    <v-autocomplete
      v-model="selected"
      v-model:search="input"
      class="w3-autocomplete"
      :class="classes"
      menu-icon=""
      :append-inner-icon="mdiMagnify"
      :label="showFloatingLabel ? label : undefined"
      :placeholder="showFloatingLabel ? undefined : label"
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
      <!-- Same look as the global search results: round avatar, battleTag on
           top (its #number dimmed) and a second line underneath (here the
           shared match count). -->
      <template v-slot:item="{ props: itemProps, item }">
        <v-list-item :prepend-avatar="getAvatarUrlFor(item.raw.battleTag)" v-bind="{ ...itemProps, title: undefined }">
          <v-list-item-title>
            {{ battleTagName(item.raw.battleTag) }}<span class="text-medium-emphasis">{{ battleTagNumber(item.raw.battleTag) }}</span>
          </v-list-item-title>
          <v-list-item-subtitle v-if="item.raw.matchCount !== undefined">
            {{ subtitleText(item.raw) }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-autocomplete>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch, PropType } from "vue";
import debounce from "debounce";
import ProfileService from "@/services/ProfileService";
import MatchService from "@/services/MatchService";
import PersonalSettingsService from "@/services/PersonalSettingsService";
import { ProfilePicture } from "@/store/personalSettings/types";
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory, EGameMode } from "@/store/types";
import { Gateways } from "@/store/ranking/types";
import { useRankingStore } from "@/store/ranking/store";
import { useI18n } from "vue-i18n";

import { mdiMagnify } from "@mdi/js";

type SearchDensity = "default" | "comfortable" | "compact";

type SearchedPlayer = {
  battleTag: string;
  // Only set when searching within a player's match history.
  matchCount?: number;
  wins?: number;
  losses?: number;
};

export default defineComponent({
  name: "PlayerSearch",
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
    // Empty = the localized "Search BattleTag" default (see `label` below;
    // a prop default cannot call `t()`).
    searchLabel: {
      type: String,
      required: false,
      default: "",
    },
    // When set to a battleTag, only players sharing matches with it are searched
    // (scoped to season/gateway), so no result ever leads to an empty match list.
    opponentOf: {
      type: String,
      required: false,
      default: "",
    },
    season: {
      type: Number,
      required: false,
      default: -1,
    },
    gateway: {
      type: Number as PropType<Gateways>,
      required: false,
      // 0 = GateWay.Undefined on the backend, i.e. no gateway filter.
      default: 0,
    },
    // Scopes each suggestion's match count to one game mode. Opponents without
    // matches in that mode are still suggested, with a "No <mode> matches" line.
    gameMode: {
      type: Number as PropType<EGameMode>,
      required: false,
      default: EGameMode.UNDEFINED,
    },
  },
  setup: (props, context) => {
    const { t } = useI18n();
    const rankingStore = useRankingStore();
    const input = ref<string>("");
    const isLoading = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const debouncedSearch = debounce((val: string) => dispatchSearch(val), SEARCH_DELAY);
    const searchedPlayers = ref<SearchedPlayer[]>([]);
    const selected = ref<string>();
    const profilePictures = ref<Record<string, ProfilePicture | undefined>>({});
    let searchToken = 0;

    const isOpponentSearch = computed<boolean>(() => !!props.opponentOf);
    const minSearchLength = computed<number>(() => (isOpponentSearch.value ? 1 : 3));
    const label = computed<string>(() => props.searchLabel || t("components_common_playersearch.searchLabel"));

    async function dispatchSearch(val: string) {
      const token = ++searchToken;
      const players: SearchedPlayer[] = isOpponentSearch.value
        ? await MatchService.searchOpponents(props.opponentOf, val, props.season, props.gateway, props.gameMode)
        : await ProfileService.searchPlayer(val.toLowerCase());
      if (token !== searchToken) return;
      searchedPlayers.value = players;
      isLoading.value = false;
      loadProfilePictures(players.map((player) => player.battleTag));
    }

    // Keep opponent results in sync with the table when the season, gateway or
    // game mode changes: re-run a typed search, otherwise drop the now-stale list.
    watch(() => [props.season, props.gateway, props.gameMode], () => {
      if (!isOpponentSearch.value) return;
      const current = input.value && input.value !== selected.value ? input.value : "";
      if (current.length >= minSearchLength.value) {
        dispatchSearch(current);
      } else {
        searchedPlayers.value = [];
      }
    });

    async function loadProfilePictures(battleTags: string[]): Promise<void> {
      const newTags = battleTags.filter((tag) => !(tag in profilePictures.value));
      if (newTags.length === 0) return;
      for (const tag of newTags) {
        profilePictures.value[tag] = undefined;
      }

      const settings = await PersonalSettingsService.retrievePersonalSettingSummaries(newTags);
      for (const setting of settings) {
        profilePictures.value[setting.id] = setting.profilePicture;
      }
    }

    function getAvatarUrlFor(battleTag: string): string {
      const pfp = profilePictures.value[battleTag];
      if (pfp) {
        return getAvatarUrl(pfp.race, pfp.pictureId, pfp.isClassic);
      }

      // Players without personal settings get the same default the backend uses:
      // a starter avatar (1-5), derived from the battleTag so it is stable across renders.
      let hash = 0;
      for (let i = 0; i < battleTag.length; i++) {
        hash = (hash * 31 + battleTag.charCodeAt(i)) | 0;
      }
      return getAvatarUrl(EAvatarCategory.STARTER, (Math.abs(hash) % 5) + 1, false);
    }

    // "Rampage#2131" -> "Rampage" + "#2131", so the number can be dimmed.
    function battleTagName(battleTag: string): string {
      const hashIndex = battleTag.lastIndexOf("#");
      return hashIndex === -1 ? battleTag : battleTag.slice(0, hashIndex);
    }

    function battleTagNumber(battleTag: string): string {
      const hashIndex = battleTag.lastIndexOf("#");
      return hashIndex === -1 ? "" : battleTag.slice(hashIndex);
    }

    // Same display name the mode filter uses (translation first, API name as fallback).
    const searchModeName = computed<string>(() => {
      if (props.gameMode === EGameMode.UNDEFINED) return "";
      const mode = rankingStore.activeModes.find((activeMode) => activeMode.id === props.gameMode);
      return mode ? (t(`gameModes.${EGameMode[props.gameMode]}`) || mode.name) : "";
    });

    // The count and record are scoped to the active mode filter; a zero says
    // which mode is empty, so a suggestion never looks like it has no shared
    // matches at all.
    function subtitleText(player: SearchedPlayer): string {
      const count = player.matchCount ?? 0;
      if (count === 0 && searchModeName.value) {
        return t("components_common_playersearch.noModeMatches", { mode: searchModeName.value });
      }
      const countText = t("components_common_playersearch.matchCount", count);
      if (count === 0 || player.wins === undefined || player.losses === undefined) {
        return countText;
      }
      return `${countText} · ${t("components_common_playersearch.record", { wins: player.wins, losses: player.losses })}`;
    }

    watch(selected, onSelect);

    function onSelect(btag: string | undefined): void {
      if (!btag) return;
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
      // Selecting a player writes their battleTag back into the search field;
      // don't fire (and reopen) a new search for it.
      if (val && val === selected.value) return;
      if (!val || val.length < minSearchLength.value) {
        searchedPlayers.value = [];
        return;
      }
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

    const noDataText = computed<string>(() => {
      if (!input.value || input.value.length < minSearchLength.value) {
        return isOpponentSearch.value
          ? t("components_common_playersearch.typeToSearch")
          : t("components_common_playersearch.typeAtLeast3Letters");
      }
      if (isLoading.value) {
        return t("components_common_playersearch.loading");
      }
      return isOpponentSearch.value
        ? t("components_common_playersearch.noOpponentsFound")
        : t("components_common_playersearch.noPlayerFound");
    });

    return {
      mdiMagnify,
      selected,
      input,
      label,
      noDataText,
      isLoading,
      searchedPlayers,
      getAvatarUrlFor,
      battleTagName,
      battleTagNumber,
      subtitleText,
      clearSearch,
      submitSearch,
    };
  },
});
</script>
