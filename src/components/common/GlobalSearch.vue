<template>
  <v-menu
    v-model="menuOpened"
    content-class="global-search"
    location="bottom"
    transition="slide-y-transition"
    :offset="18"
    :width="365"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ props }">
      <v-btn variant="text" tile v-bind="props">
        <v-icon size="x-large" class="mr-2">{{ mdiMagnify }}</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="autocomplete-wrapper px-2 pb-2 pt-0">
        <v-autocomplete
          v-model="searchModel"
          v-model:search="search"
          :append-inner-icon="mdiMagnify"
          menu-icon=""
          label="Search"
          single-line
          clearable
          autofocus
          :no-data-text="noDataText"
          :loading="isLoading"
          :items="players"
          item-title="battleTag"
          item-value="battleTag"
          :placeholder="$t(`views_rankings.searchPlaceholder`)"
          bg-color="transparent"
          glow
          return-object
          autocomplete="off"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item :prepend-avatar="getPlayerAvatarUrl(item.raw)">
              <div v-bind="props">
                <v-list-item-title>
                  {{ item.raw.battleTag }}
                </v-list-item-title>
                <v-list-item-title>
                  <div v-for="season in item.raw.seasons" :key="season.id" class="mr-1 mt-1 d-inline-block">
                    <season-badge :season="season" />
                  </div>
                </v-list-item-title>
              </div>
            </v-list-item>
          </template>
          <template v-slot:append-item>
            <div v-intersect="endIntersect"></div>
          </template>
        </v-autocomplete>
      </v-card-title>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import debounce from "debounce";
import { getAvatarUrl, getProfileUrl } from "@/helpers/url-functions";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { PlayerSearchInfo } from "@/store/globalSearch/types";
import { useGlobalSearchStore } from "@/store/globalSearch/store";
import { useRouter } from "vue-router";
import { mdiMagnify } from "@mdi/js";
import { Intersect } from "vuetify/directives";

export default defineComponent({
  name: "GlobalSearch",
  components: {
    SeasonBadge,
  },
  directives: {
    intersect: Intersect,
  },
  setup() {
    const router = useRouter();
    const searchModel = ref<PlayerSearchInfo | null>(null);
    const search = ref<string>("");
    const isLoading = ref<boolean>(false);
    const menuOpened = ref<boolean>(false);
    const SEARCH_DELAY = 500;
    const debouncedSearch = debounce(dispatchSearch, SEARCH_DELAY);
    const globalSearchStore = useGlobalSearchStore();

    watch(searchModel, onSearchModelChanged);

    // Handler when selecting a player from the list
    function onSearchModelChanged(player: PlayerSearchInfo) {
      // We cleared the input, ignore
      if (!player?.battleTag) return;

      // Nativate to the selected player's profile
      router.push({
        path: getProfileUrl(player.battleTag),
      }).catch(() => null);

      // Since the global search is present on all pages, we need to manually close it
      menuOpened.value = false;

      // Reset the global search state
      globalSearchStore.clearSearch();
      searchModel.value = {} as PlayerSearchInfo;
    }

    watch(search, onSearchChanged);

    function onSearchChanged() {
      searchChangeHandler();
    }

    function dispatchSearch(append = false) {
      globalSearchStore.search({ searchText: search.value, append });
    }

    function searchChangeHandler(append = false) {
      if (search.value && search.value.length >= 3) {
        isLoading.value = true;
        debouncedSearch(append);
      } else {
        globalSearchStore.clearSearch();
        isLoading.value = false;
        // Prevent previous calls from executing
        debouncedSearch.clear();
      }
    }

    // Reached the end of the list, try to load more players
    function endIntersect(_entries: unknown, _observer: unknown, isIntersecting: boolean) {
      if (isIntersecting && !isLoading.value && allowAppend()) {
        searchChangeHandler(true);
      }
    }

    const noDataText = computed<string>(() => {
      if (!search.value || search.value.length < 3) {
        return "Type at least 3 letters";
      }
      if (isLoading.value) {
        return "Loading...";
      }

      return "No player found";
    });

    const players = computed<PlayerSearchInfo[]>(() => globalSearchStore.players);

    function getPlayerAvatarUrl(player: PlayerSearchInfo): string {
      const pfp = player.profilePicture;
      return getAvatarUrl(pfp.race, pfp.pictureId, pfp.isClassic);
    }

    const allowAppend = (): boolean => globalSearchStore.hasMore;

    watch(players, onPlayersChanged);

    function onPlayersChanged() {
      // If the players array has changed it means the global search request finished
      isLoading.value = false;
    }

    return {
      menuOpened,
      searchModel,
      search,
      noDataText,
      isLoading,
      players,
      getPlayerAvatarUrl,
      endIntersect,
      mdiMagnify,
    };
  },
});
</script>

<style lang="scss" scoped>
.global-search {
  z-index: 1000 !important;
  .autocomplete-wrapper {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
