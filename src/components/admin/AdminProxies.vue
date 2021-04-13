<template>
    <v-container>
      <v-row>
        <v-col>
          <v-card class="px-1 m-0">
            <node-overrides-card></node-overrides-card>
          </v-card>
        </v-col>
        <v-col>
          <v-card class="px-1 m-0" >
            <node-overrides-card
              :automaticNodes="true">
            </node-overrides-card>
          </v-card>
        </v-col>
      </v-row>
      
      
      
      <!-- <v-autocomplete 
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
      </v-autocomplete> -->
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import { Proxy } from "@/store/admin/types";

@Component({ components: { nodeOverridesCard } })
export default class AdminProxies extends Vue {

  public sanitizeString(string : string) : string {

    let str = string;
    str = str.replace(/-/g, `_`)

    return str;
  }

  get availableProxies() : Proxy[] {
    return this.$store.direct.state.admin.availableProxies;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() : Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadAvailableProxies(this.$store.direct.state.oauth.token);
    }
  }

  async mounted() : Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss">

</style>