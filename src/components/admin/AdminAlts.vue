<template>
  <v-container>
    <v-row>
      <!-- Autocomplete Btag search -->
      <v-autocomplete
        class="ml-5 mr-5"
        v-model="searchPlayerModel"
        :append-icon="mdiMagnify"
        label="Search BattleTag"
        clearable
        placeholder=" "
        :items="searchedPlayers"
        :search-input.sync="search"
        return-object
        @click:clear="revertToDefault"
        autofocus
      ></v-autocomplete>
    </v-row>

    <v-card v-if="showAlts">
      <v-card-title>Smurfs:</v-card-title>
      <v-list>
        <template v-for="alt in alts">
          <v-list-item :key="alt">
            <div @click="searchAltsFromClick(alt)" class="pointer">{{ alt }}</div>
            <v-spacer></v-spacer>
            <v-btn @click="goToProfile(alt)">Go to profile</v-btn>
          </v-list-item>
        </template>
      </v-list>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { useAdminStore } from "@/store/admin/store";
import { mdiMagnify } from "@mdi/js";
import { getProfileUrl } from "@/helpers/url-functions";

@Component({})
export default class AdminAlts extends Vue {
  public searchPlayerModel = "";
  public search = "";
  public showAlts = false;
  public oldSearchTerm = "";
  public alts = [] as string[];
  private adminStore = useAdminStore();
  public mdiMagnify = mdiMagnify;

  public revertToDefault(): void {
    this.showAlts = false;
    this.oldSearchTerm = "";
    this.adminStore.clearSearch();
    this.alts = [];
  }

  @Watch("searchPlayerModel")
  public async onSearchStringChanged(bTag: string): Promise<void> {
    if (!bTag) return;

    if (bTag) {
      this.alts = await this.adminStore.getAltsForPlayer(bTag);

      if ((this.alts != null || undefined) && this.alts.length > 0) {
        this.showAlts = true;
      } else {
        this.revertToDefault();
      }
    }
  }

  @Watch("search")
  public onSearchChanged(newValue: string): void {
    if (newValue && newValue.length > 2 && newValue !== this.oldSearchTerm) {
      this.adminStore.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.revertToDefault();
    }
  }

  get searchedPlayers(): string[] {
    return this.adminStore.searchedPlayers.map((player) => player.battleTag);
  }

  public goToProfile(alt: string): void {
    this.$router.push({
      path: getProfileUrl(alt),
    }).catch(() => null);
  }

  public searchAltsFromClick(bTag: string) {
    this.searchPlayerModel = bTag;
    this.search = bTag;
  }
}
</script>

<style lang="scss">
.pointer {
  cursor: pointer;
}
</style>
