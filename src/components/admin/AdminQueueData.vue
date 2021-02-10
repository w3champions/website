<template >
  <v-container>
    <v-card>
      <v-expansion-panels tile>
        <template>
          <v-expansion-panel tile v-for="(mode, index) in gameModes" :key="index">
            <v-expansion-panel-header>
              {{ mode.text }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <template>
                <div v-if="getPlayerDataInGamemode(mode.modeId) != null">
                  <v-data-table
                  :items="getPlayerDataInGamemode(mode.modeId)">
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

@Component({ components: {} })
export default class AdminQueueData extends Vue {

  get headers() : Array<unknown> {
    return [
      {
        text: "Battletag",
        align: "start",
        sortable: false,
      },
      {
        text: "MMR",
        align: "start",
        sortable: true,
      },
      {
        text: "Quantile",
        align: "start",
        sortable: true,
      },
      {
        text: "Activity Quantile",
        align: "start",
        sortable: true,
      },
      {
        text: "Server Option",
        align: "start",
        sortable: true
      },
      {
        text: "Flo Connected",
        align: "start",
        sortable: true,
      },
      {
        text: "Closest Server",
        align: "start",
        sortable: true,
      },
    ]
  }

  @Watch("isAdmin")
  onBattleTagChanged() {
    this.init();
  }

  private async init() : Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadQueueData(this.$store.direct.state.oauth.token);
    }
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
    ];
  }

  getPlayerDataInGamemode(modeId : number) : QueueData {

    for (let i=0; i<this.queueData.length; i++) {
      if (this.queueData[i].gameMode == modeId) {
        return this.queueData[i];
      }
    }
    
    return this.queueData[0];
  }

  async mounted() {
    await this.init();
  }

}
</script>

<style lang="scss">

</style>
