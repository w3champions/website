<template>
  <div>
    <v-card-title>
      Live Queue Data
    </v-card-title>
    <v-container>
      <v-card>
        <v-expansion-panels tile multiple>
          <v-expansion-panel
            v-for="(mode, index) in gameModes"
            :key="index"
            tile
          >
            <v-expansion-panel-title>
              {{ mode.name }}
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div v-if="getPlayerDataInGamemode(mode.id) != null">
                <v-data-table
                  :headers="headers"
                  :items="getPlayerDataInGamemode(mode.id)"
                  :items-per-page="-1"
                  :disable-pagination="true"
                  :hide-default-footer="true"
                />
              </div>
              <div v-else>No Data found.</div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, watch } from "vue";
import { QueueData, QueuedPlayer } from "@/store/admin/types";
import { activeGameModes, IGameModeBrief, loadActiveGameModes } from "@/composables/GameModesMixin";
import { EGameMode } from "@/store/types";
import AppConstants from "@/constants";
import { useOauthStore } from "@/store/oauth/store";
import { useAdminStore } from "@/store/admin/store";
import { DataTableHeader } from "vuetify";

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

    const headers: DataTableHeader[] = [
      {
        title: "Battletag",
        value: "battleTag",
        sortable: false,
      },
      {
        title: "MMR",
        value: "mmr",
        sortable: true,
      },
      {
        title: "RD",
        value: "rd",
        sortable: true,
      },
      {
        title: "Quantile",
        value: "quantile",
        sortable: true,
      },
      {
        title: "Activity Quantile",
        value: "activityQuantile",
        sortable: true,
      },
      {
        title: "Queue Time",
        value: "queueTime",
        sortable: true,
      },
      {
        title: "Flo Connected",
        value: "isFloConnected",
        sortable: true,
      },
      {
        title: "Location",
        value: "location",
        sortable: false,
      },
      {
        title: "Server Option",
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
