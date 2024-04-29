<template>
  <div>
    <v-card-title>
      Live Queue Data
    </v-card-title>
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

  </div>
</template>

<script lang="ts">
import { QueueData } from "@/store/admin/types";
import GameModesMixin from "@/mixins/GameModesMixin";
import { EGameMode } from "@/store/types";
import { Component, Watch, Mixins, Prop } from "vue-property-decorator";
import { LocaleMessage } from "vue-i18n";
import AppConstants from "@/constants";
import { useOauthStore } from "@/store/oauth/store";
import { useAdminStore } from "@/store/admin/store";

@Component({ components: {} })
export default class AdminQueueData extends Mixins(GameModesMixin) {
  private oauthStore = useOauthStore();
  @Prop() disabledModes?: EGameMode[];
  _intervalRefreshHandle?: number = undefined;
  private adminStore = useAdminStore();

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
      await this.adminStore.loadQueueData(
        this.oauthStore.token
      );
    }
  }

  private async refresh(): Promise<void> {
    await this.adminStore.loadQueueData(
      this.oauthStore.token
    );
  }

  get queueData(): QueueData[] {
    return this.adminStore.queuedata;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
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
