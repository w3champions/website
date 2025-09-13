<template>
  <v-menu
    v-model="menuOpened"
    content-class="global-search"
    bottom
    offset-y
    transition="slide-y-transition"
    :nudge-bottom="18"
    :nudge-width="300"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on }">
      <v-btn text tile v-on="on">
        <v-icon class="mr-2">{{ mdiMagnify }}</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="autocomplete-wrapper px-2 pb-2 pt-0">
        <v-autocomplete
          v-model="searchModel"
          :append-icon="mdiMagnify"
          label="Search"
          single-line
          clearable
          autofocus
          :placeholder="$t(`views_rankings.searchPlaceholder`)"
          return-object
          :search-input.sync="search"
          :no-data-text="noDataText"
          :loading="isLoading"
          :items="players"
          item-text="battleTag"
          item-value="battleTag"
        >
          <template v-slot:item="data">
            <v-list-item-avatar>
              <img :src="getPlayerAvatarUrl(data.item)" />
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                {{ data.item.battleTag }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <div
                  v-for="season in data.item.seasons"
                  :key="season.id"
                  class="mr-1 mt-1 d-inline-block"
                >
                  <season-badge :season="season" />
                </div>
              </v-list-item-subtitle>
            </v-list-item-content>
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
import { useRouter } from "vue-router/composables";
import { mdiMagnify } from "@mdi/js";
import { Intersect } from "vuetify/lib";

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
    const searchModel = ref<PlayerSearchInfo>({} as PlayerSearchInfo);
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
