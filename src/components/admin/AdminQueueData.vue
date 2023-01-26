<template>
  <v-container>
    <v-card>
      <v-expansion-panels tile multiple>
        <template>
          <v-expansion-panel
            tile
            v-for="(mode, index) in gameModes"
            :key="index"
          >
            <v-expansion-panel-header>
              {{ mode.name }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <template>
                <div v-if="getPlayerDataInGamemode(mode.id) != null">
                  <v-data-table
                    :headers="headers"
                    :items="getPlayerDataInGamemode(mode.id)"
                    :items-per-page="-1"
                    :disable-pagination="true"
                    :hide-default-footer="true"
                  ></v-data-table>
                </div>
                <div v-else>No Data found.</div>
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
import GameModesMixin from "@/mixins/GameModesMixin";
import { EGameMode } from "@/store/typings";
import { Component, Watch, Mixins, Prop } from "vue-property-decorator";
import { LocaleMessage } from "vue-i18n";
import AppConstants from "@/constants";

@Component({ components: {} })
export default class AdminQueueData extends Mixins(GameModesMixin) {
  @Prop() disabledModes?: EGameMode[];
  _intervalRefreshHandle?: number = undefined;

  get headers(): Array<unknown> {
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
      },
    ];
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    await this.loadActiveGameModes();

    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadQueueData(
        this.$store.direct.state.oauth.token
      );
    }
  }

  private async refresh(): Promise<void> {
    await this.$store.direct.dispatch.admin.loadQueueData(
      this.$store.direct.state.oauth.token
    );
  }

  get queueData(): QueueData[] {
    return this.$store.direct.state.admin.queuedata;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  getPlayerDataInGamemode(modeId: number): unknown {
    for (let i = 0; i < this.queueData.length; i++) {
      if (this.queueData[i].gameMode == modeId) {
        return this.queueData[i].snapshot;
      }
    }

    return null;
  }

  get gameModes(): Array<{ name: LocaleMessage; id: number }> {
    let modes = this.activeGameModes;

    if (this.disabledModes) {
      modes = modes?.filter((x) => !this.disabledModes?.includes(x.id));
    }

    return modes;
  }

  async mounted(): Promise<void> {
    await this.init();

    this._intervalRefreshHandle = setInterval(async () => {
      await this.refresh();
    }, AppConstants.queueDataRefreshInterval);
  }

  destroyed(): void {
    clearInterval(this._intervalRefreshHandle);
  }
}
</script>

<style lang="scss"></style>
