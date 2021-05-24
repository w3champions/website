<template >
  <v-container>
    <v-card>
      <v-expansion-panels 
        tile
        multiple>
        <template>
          <v-expansion-panel 
            tile 
            v-for="(mode, index) in gameModes" 
            :key="index">
            <v-expansion-panel-header>
              {{ mode.text }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <template>
                <div v-if="getPlayerDataInGamemode(mode.modeId) != null">
                  <v-data-table
                  :headers="headers"
                  :items="getPlayerDataInGamemode(mode.modeId)"
                  :items-per-page="-1"
                  :disable-pagination="true"
                  :hide-default-footer="true">
                  </v-data-table>
                </div>
                <div v-else>
                  No Data found.
                </div>
              </template>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </template>
        </v-expansion-panels>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { QueueData } from "@/store/admin/types";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { EGameMode } from "@/store/typings";
import AppConstants from "@/constants";

@Component({ components: {} })
export default class AdminQueueData extends Vue {

  _intervalRefreshHandle?: number = undefined;

  get headers() : Array<unknown> {
    return [
      {
        text: "Battletag",
        value: "battleTag",
        align: "start",
        sortable: false,
      },
      {
        text: "MMR",
        value: "mmr",
        align: "start",
        sortable: true,
      },
      {
        text: "RD",
        value: "rd",
        align: "start",
        sortable: true,
      },
      {
        text: "Quantile",
        value: "quantile",
        align: "start",
        sortable: true,
      },
      {
        text: "Activity Quantile",
        value: "activityQuantile",
        align: "start",
        sortable: true,
      },
      {
        text: "Queue Time",
        value: "queueTime",
        align: "start",
        sortable: true,
      },
      {
        text: "Flo Connected",
        value: "isFloConnected",
        align: "start",
        sortable: true,
      },
      {
        text: "Location",
        value: "location",
        align: "start",
        sortable: false,
      },
      {
        text: "Server Option",
        value: "serverOption",
        align: "start",
        sortable: true,
      }
    ]
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() : Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadQueueData(this.$store.direct.state.oauth.token);
    }
  }

  private async refresh() : Promise<void> {
    await this.$store.direct.dispatch.admin.loadQueueData(this.$store.direct.state.oauth.token);
  }

  get queueData() : QueueData[] {
    return this.$store.direct.state.admin.queuedata;
  }

  get isAdmin() : boolean {
      return this.$store.direct.state.oauth.isAdmin;
  }

  get gameModes() : Array<unknown> {
    return [
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_1ON1]}`),
        modeId: EGameMode.GM_1ON1,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_2ON2]}`),
        modeId: EGameMode.GM_2ON2,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_4ON4]}`),
        modeId: EGameMode.GM_4ON4,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_FFA]}`),
        modeId: EGameMode.GM_FFA,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_FOOTMEN_FRENZY]}`),
        modeId: EGameMode.GM_FOOTMEN_FRENZY,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_LEGION_4v4_X3]}`),
        modeId: EGameMode.GM_LEGION_4v4_X3,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_LEGION_1v1_x20]}`),
        modeId: EGameMode.GM_LEGION_1v1_x20,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_LEGION_4v4_X20]}`),
        modeId: EGameMode.GM_LEGION_4v4_X20,
      },
      {
        text: this.$t(`gameModes.${EGameMode[EGameMode.GM_ROC_1ON1]}`),
        modeId: EGameMode.GM_ROC_1ON1,
      },
    ];
  }

  getPlayerDataInGamemode(modeId : number) : unknown {

    for (let i=0; i<this.queueData.length; i++) {
      if (this.queueData[i].gameMode == modeId) { 
        return this.queueData[i].snapshot;
      }

    }
    
    return null;
    
  }

  async mounted() : Promise<void> {
    await this.init();

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refresh();
    }, AppConstants.queueDataRefreshInterval)
  }

  destroyed() : void {
    clearInterval(this._intervalRefreshHandle);
  }

}
</script>

<style lang="scss">

</style>
