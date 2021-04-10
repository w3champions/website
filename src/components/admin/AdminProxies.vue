<template>
    <v-container>
      <v-row>
        <v-autocomplete 
          class="ml-5 mr-5"
          v-model="searchModel"
          append-icon="mdi-magnify"
          label="Search"
          single-line
          clearable
          :items="searchRanks"
          :loading="isLoading"
          :search-input.sync="search"
          :no-data-text="noDataText"
          item-text="player.name"
          item-value="player.id"
          placeholder="Start typing to Search"
          return-object
        >
          <template v-slot:item="data">
            <template v-if="typeof data.item !== 'object'">
              <v-list-item-content v-text="data.item"></v-list-item-content>
            </template>
            <template v-else>
              <v-list-item-content>
                <v-list-item-title>
                  <span v-if="!isDuplicateName(data.item.player.name)">
                    {{ data.item.player.name }}
                  </span>
                  <span v-if="isDuplicateName(data.item.player.name)">
                    {{
                      data.item.player.playerIds
                        .map((p) => p.battleTag)
                        .join(" & ")
                    }}
                  </span>
                  <span
                    v-if="
                      data.item.player.gameMode === gameModes.GM_1ON1 &&
                      data.item.player.race
                    "
                  >
                    ({{ $t(`racesShort.${races[data.item.player.race]}`) }})
                  </span>
                </v-list-item-title>
                <v-list-item-subtitle v-if="playerIsRanked(data.item)">
                  Wins: {{ data.item.player.wins }} | Losses:
                  {{ data.item.player.losses }} | Total:
                  {{ data.item.player.games }}
                </v-list-item-subtitle>
                <v-list-item-subtitle v-else>
                  Unranked
                </v-list-item-subtitle>
              </v-list-item-content>
            </template>
          </template>
        </v-autocomplete>
      </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
//import { BannedPlayer, LoadingScreenTip, NewsMessage } from "@/store/admin/types";

@Component({ components: {} })
export default class AdminProxies extends Vue {

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
    }
  }

  async mounted() {
    await this.init();
  }
}
</script>

<style lang="scss">

</style>