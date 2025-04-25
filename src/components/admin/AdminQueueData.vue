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
import { computed, defineComponent, onMounted, onUnmounted, watch } from "vue";
import { QueueData, QueuedPlayer } from "@/store/admin/types";
import { activeGameModes, IGameModeBrief, loadActiveGameModes } from "@/mixins/GameModesMixin";
import { EGameMode } from "@/store/types";
import AppConstants from "@/constants";
import { useOauthStore } from "@/store/oauth/store";
import { useAdminStore } from "@/store/admin/store";

export default defineComponent({
  name: "AdminQueueData",
  components: {},
  props: {
    disabledModes: {
      type: Array<EGameMode>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();
    let _intervalRefreshHandle: NodeJS.Timeout;

    const queueData = computed<QueueData[]>(() => adminStore.queuedata);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    const gameModes = computed<IGameModeBrief[]>(() => {
      let modes = activeGameModes();

      if (props.disabledModes) {
        modes = modes?.filter((x) => !props.disabledModes?.includes(x.id));
      }

      return modes;
    });

    async function refresh(): Promise<void> {
      await adminStore.loadQueueData(oauthStore.token);
    }

    function getPlayerDataInGamemode(modeId: number): QueuedPlayer[] | undefined {
      for (let i = 0; i < queueData.value.length; i++) {
        if (queueData.value[i].gameMode == modeId) {
          return queueData.value[i].snapshot;
        }
      }

      return undefined;
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await loadActiveGameModes();
      await adminStore.loadQueueData(oauthStore.token);
    }

    onMounted(async (): Promise<void> => {
      await init();

      _intervalRefreshHandle = setInterval(async () => {
        await refresh();
      }, AppConstants.queueDataRefreshInterval);
    });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    const headers = [
      {
        text: "Battletag",
        value: "battleTag",
        sortable: false,
      },
      {
        text: "MMR",
        value: "mmr",
        sortable: true,
      },
      {
        text: "RD",
        value: "rd",
        sortable: true,
      },
      {
        text: "Quantile",
        value: "quantile",
        sortable: true,
      },
      {
        text: "Activity Quantile",
        value: "activityQuantile",
        sortable: true,
      },
      {
        text: "Queue Time",
        value: "queueTime",
        sortable: true,
      },
      {
        text: "Flo Connected",
        value: "isFloConnected",
        sortable: true,
      },
      {
        text: "Location",
        value: "location",
        sortable: false,
      },
      {
        text: "Server Option",
        value: "serverOption",
        sortable: true,
      },
    ];

    return {
      gameModes,
      getPlayerDataInGamemode,
      headers,
    };
  },
});
</script>
