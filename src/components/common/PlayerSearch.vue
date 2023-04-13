<template>
  <v-autocomplete
    :class="classes"
    v-model="searchModel"
    :append-icon="mdiMagnify"
    label="Search BattleTag"
    clearable
    placeholder=" "
    :items="searchedPlayers"
    :search-input.sync="search"
    :no-data-text="noDataText"
    :loading="isLoading"
    :autofocus="setAutofocus ? true : false"
  ></v-autocomplete>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { debounce } from "debounce";
import { useAdminStore } from "@/store/admin/store";
import { mdiMagnify } from "@mdi/js";

@Component({})
export default class PlayerSearch extends Vue {
  @Prop({ default: "" }) classes?: string;
  @Prop({ default: true }) setAutofocus?: boolean;
  @Prop() clearSearchFromParent?: boolean;
  public searchModel = "";
  public search = "";
  public isLoading = false;
  private static SEARCH_DELAY = 500;
  private debouncedSearch = debounce(this.dispatchSearch, PlayerSearch.SEARCH_DELAY);
  private adminStore = useAdminStore();
  public mdiMagnify = mdiMagnify;

  private dispatchSearch() {
    this.adminStore.searchBnetTag({ searchText: this.search.toLowerCase() });
  }

  @Watch("searchModel")
  public onSearchModelChanged(btag: string): void {
    if (!btag) return;
    this.$emit("playerFound", btag);
  }

  @Watch("search")
  public onSearchChanged(): void {
    if (this.search && this.search.length > 2) {
      this.isLoading = true;
      this.debouncedSearch();
    } else {
      this.clearSearch();
      this.isLoading = false;
      // Prevent previous calls from executing
      this.debouncedSearch.clear();
    }
  }

  @Watch("clearSearchFromParent")
  public onClearSearchFromParent(): void {
    this.clearSearch();
  }

  public clearSearch(): void {
    this.$emit("searchCleared");
    this.searchModel = "";
    this.adminStore.clearSearch();
  }

  get searchedPlayers(): string[] {
    return this.adminStore.searchedPlayers
      .map((player) => player.battleTag);
  }

  get noDataText(): string {
    return (!this.search || this.search.length < 3) ? "Type at least 3 letters" : this.isLoading ? "Loading..." : "No player found";
  }

  @Watch("searchedPlayers")
  public onPlayersChanged() {
    // If the players array has changed it means the search request finished
    this.isLoading = false;
  }
}
</script>

<style lang="scss"></style>
