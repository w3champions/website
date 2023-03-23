<template>
  <v-autocomplete
    :class="classes"
    v-model="searchModel"
    append-icon="mdi-magnify"
    label="Search BattleTag"
    clearable
    placeholder=" "
    :items="searchedPlayers"
    :search-input.sync="search"
    :no-data-text="noDataText"
    autofocus
  ></v-autocomplete>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class PlayerSearch extends Vue {
  @Prop({ default: "" }) classes?: string;
  public searchModel = "";
  public search = "";

  @Watch("searchModel")
  public async onSearchStringChanged(
    btag: string
  ): Promise<void> {
    if (!btag) return;
    this.$emit("playerFound", btag);
  }

  @Watch("search")
  public onSearchChanged(): void {
    if (this.search && this.search.length > 2) {
      this.$store.direct.dispatch.admin.searchBnetTag({ searchText: this.search.toLowerCase() });
    } else {
      this.clearSearch();
    }
  }

  public clearSearch(): void {
    this.$emit("searchCleared");
    this.searchModel = "";
    this.$store.direct.dispatch.admin.clearSearch();
  }

  get searchedPlayers(): string[] {
    return this.$store.direct.state.admin.searchedPlayers
      .map((player) => player.battleTag);
  }

  get noDataText(): string {
    return (!this.search || this.search.length < 3) ? "Type at least 3 letters" : "No player found";
  }
}
</script>

<style lang="scss"></style>
