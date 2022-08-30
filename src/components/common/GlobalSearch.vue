<template>
  <v-menu
    content-class="global-search"
    bottom
    offset-y
    transition="slide-y-transition"
    v-model="menuOpened"
    :nudge-bottom="10"
    :nudge-width="300"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on }">
      <v-btn text tile v-on="on">
        <v-icon class="mr-2">
          mdi-magnify
        </v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="autocomplete-wrapper px-2 pb-2 pt-0">
        <v-autocomplete
          v-model="searchModel"
          append-icon="mdi-magnify"
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
        </v-autocomplete>
      </v-card-title>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { debounce } from "debounce";
import { getAvatarUrl, getProfileUrl } from "@/helpers/url-functions";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { PlayerSearchData } from "@/store/globalSearch/types";

@Component({
  components: {
    SeasonBadge,
  }
})
export default class GlobalSearch extends Vue {
  public searchModel: PlayerSearchData = {} as PlayerSearchData;
  public search = "";
  public isLoading = false;
  public menuOpened = false;

  private static SEARCH_DELAY = 500;

  private debouncedSearch = debounce((searchValue: string) => {
    this.$store.direct.dispatch.globalSearch.search(searchValue);
  }, GlobalSearch.SEARCH_DELAY);

  // Handler when selecting a player from the list
  @Watch("searchModel")
  public onSearchModelChanged(player: PlayerSearchData) {
    // We cleared the input, ignore
    if (!player?.battleTag) return;

    // Nativate to the selected player's profile
    this.$router.push({
      path: getProfileUrl(player.battleTag),
    });

    // Since the global search is present on all pages, we need to manually close it
    this.menuOpened = false;

    // Reset the global search state
    this.$store.direct.dispatch.globalSearch.clearSearch();
    this.searchModel = {} as PlayerSearchData;
  }

  @Watch("search")
  public onSearchChanged(searchValue: string) {
    if (searchValue && searchValue.length >= 3) {
      this.isLoading = true;
      this.debouncedSearch(searchValue);
    } else {
      this.$store.direct.dispatch.globalSearch.clearSearch();
      this.isLoading = false;
      // Prevent previous calls from executing
      this.debouncedSearch.clear();
    }
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at least 3 letters";
    }
    if (this.isLoading) {
      return "Loading..."
    }

    return "No player found";
  }

  getPlayerAvatarUrl(player: PlayerSearchData) {
    const pfp = player.profilePicture;
    
    return getAvatarUrl(pfp.race, pfp.pictureId, pfp.isClassic);
  }

  get players(): PlayerSearchData[] {
    return this.$store.direct.state.globalSearch.players;
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
  .autocomplete-wrapper {
    .v-text-field__details {
      display: none;
    }
  }
}
</style>
