<template>
  <v-menu
    content-class="global-search"
    bottom
    offset-y
    transition="slide-y-transition"
    v-model="menuOpened"
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
          v-model::search-input.sync="searchModel"
          :append-icon="mdiMagnify"
          label="Search"
          single-line
          clearable
          autofocus
          :placeholder="$t(`views_rankings.searchPlaceholder`)"
          return-object
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
            <div v-intersect="endIntersect" />
          </template>
        </v-autocomplete>
      </v-card-title>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Watch, Vue } from "vue-facing-decorator";
import debounce from "debounce";
import { getAvatarUrl, getProfileUrl } from "@/helpers/url-functions";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { PlayerSearchData } from "@/store/globalSearch/types";
import { useGlobalSearchStore } from "@/store/globalSearch/store";
import { mdiMagnify } from "@mdi/js";

@Component({
  components: {
    SeasonBadge,
  },
})
export default class GlobalSearch extends Vue {
  public searchModel: PlayerSearchData = {} as PlayerSearchData;
  public search = "";
  public isLoading = false;
  public menuOpened = false;
  public mdiMagnify = mdiMagnify;

  private static SEARCH_DELAY = 500;
  private debouncedSearch = debounce(this.dispatchSearch, GlobalSearch.SEARCH_DELAY);
  private globalSearchStore = useGlobalSearchStore();

  // Handler when selecting a player from the list
  @Watch("searchModel")
  public onSearchModelChanged(player: PlayerSearchData) {
    // We cleared the input, ignore
    if (!player?.battleTag) return;

    // Nativate to the selected player's profile
    this.$router.push({
      path: getProfileUrl(player.battleTag),
    }).catch(() => null);

    // Since the global search is present on all pages, we need to manually close it
    this.menuOpened = false;

    // Reset the global search state
    this.globalSearchStore.clearSearch();
    this.searchModel = {} as PlayerSearchData;
  }

  @Watch("search")
  public onSearchChanged() {
    this.searchChangeHandler();
  }

  private dispatchSearch(append = false) {
    this.globalSearchStore.search({ searchText: this.search, append });
  }

  private searchChangeHandler(append = false) {
    if (this.search && this.search.length >= 3) {
      this.isLoading = true;
      this.debouncedSearch(append);
    } else {
      this.globalSearchStore.clearSearch();
      this.isLoading = false;
      // Prevent previous calls from executing
      this.debouncedSearch.clear();
    }
  }

  // Reached the end of the list, try to load more players
  public endIntersect(_entries: unknown, _observer: unknown, isIntersecting: boolean) {
    if (isIntersecting && !this.isLoading && this.allowAppend) {
      this.searchChangeHandler(true);
    }
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }
    if (this.isLoading) {
      return "Loading...";
    }

    return "No player found";
  }

  getPlayerAvatarUrl(player: PlayerSearchData) {
    const pfp = player.profilePicture;

    return getAvatarUrl(pfp.race, pfp.pictureId, pfp.isClassic);
  }

  get players(): PlayerSearchData[] {
    return this.globalSearchStore.players;
  }

  get allowAppend(): boolean {
    return this.globalSearchStore.hasMore;
  }

  @Watch("players")
  public onPlayersChanged() {
    // If the players array has changed it means the global search request finished
    this.isLoading = false;
  }
}
</script>

<style lang="scss">
.global-search {
  z-index: 1000 !important;
  .autocomplete-wrapper {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
