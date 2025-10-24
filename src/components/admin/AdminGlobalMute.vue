<template>
  <div>
    <v-card-title>
      Global Mute
    </v-card-title>
    <v-container>
      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="globallyMutedPlayers"
        hide-default-footer
        :sort-by="[{ key: 'id', order: 'desc' }]"
        :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
      >
        <template v-slot:top>
          <v-toolbar flat color="transparent">
            <v-text-field
              v-model="searchQuery"
              label="Search mute"
              :prepend-icon="mdiMagnify"
              variant="underlined"
              @keydown.enter="loadMutes"
            />
            <v-spacer />
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mb-2 bg-primary w3-race-bg--text"
                  v-bind="props"
                >
                  {{ $t(`views_admin.mutePlayer`) }}
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  {{ $t(`views_admin.mutePlayer`) }}
                </v-card-title>

                <v-card-text>
                  <v-container class="px-0">
                    <v-col class="pb-5">
                      <player-search
                        @searchCleared="searchCleared"
                        @playerFound="playerFound"
                      />
                    </v-col>
                    <v-row v-if="showConfirmation" class="px-6 pt-2">
                      <v-menu
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        min-width="290px"
                      >
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-model="selectedDateString"
                            readonly
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="props"
                            class="w-100"
                            variant="underlined"
                          />
                        </template>
                        <v-date-picker
                          v-model="selectedDate"
                          first-day-of-week="1"
                          hide-header
                          show-adjacent-months
                          max="2099-01-01"
                          @update:modelValue="setSelectedDateString"
                        >
                          <v-spacer />
                          <v-btn
                            variant="text"
                            @click="
                              clearDate();
                              dateMenu = false;
                            "
                          >
                            {{ $t(`views_admin.cancel`) }}
                          </v-btn>
                          <v-btn
                            color="primary"
                            class="w3-race-bg--text"
                            @click="dateMenu = false"
                          >
                            {{ $t(`views_admin.ok`) }}
                          </v-btn>
                        </v-date-picker>
                      </v-menu>

                      <v-card-text>
                        Are you sure you want to mute this player?
                      </v-card-text>
                      <v-card-title>
                        {{ player }}
                        <v-spacer />
                      </v-card-title>
                    </v-row>

                    <v-row class="mx-1">
                      <v-col>
                        <v-btn
                          color="primary"
                          class="w3-race-bg--text"
                          @click="close"
                        >
                          {{ $t(`views_admin.cancel`) }}
                        </v-btn>
                      </v-col>
                      <v-col class="text-right">
                        <v-btn
                          v-if="showConfirmation && selectedDate"
                          color="primary"
                          class="w3-race-bg--text"
                          @click="save"
                        >
                          {{ $t(`views_admin.ok`) }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-toolbar>
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-icon size="small" @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
        </template>
      </v-data-table>
      <v-row class="ma-2">
        <v-spacer />
        <v-btn v-if="!searchQuery" color="primary" class="w3-race-bg--text" @click="loadMutes">
          Next
        </v-btn>
        <v-spacer />
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { GloballyMutedPlayer, GlobalMute } from "@/store/admin/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { useOauthStore } from "@/store/oauth/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiMagnify, mdiDelete } from "@mdi/js";
import { DataTableHeader } from "vuetify";
import { formatTimestampString } from "@/helpers/date-functions";

export default defineComponent({
  name: "AdminGlobalMute",
  components: {
    PlayerSearch,
  },
  setup() {
    const adminStore = useAdminStore();
    const oauthStore = useOauthStore();
    const playerSearchStore = usePlayerSearchStore();

    const dateMenu = ref<boolean>(false);
    const dialog = ref<boolean>(false);
    const showConfirmation = ref<boolean>(false);
    const player = ref<string>("");
    const searchQuery = ref<string | undefined>(undefined);
    const selectedDate = ref<Date>();
    const selectedDateString = ref<string>("");
    const mutesNextId = computed<number | null>(() => adminStore.mutesNextId);

    const globallyMutedPlayers = computed<GloballyMutedPlayer[]>(() => adminStore.globallyMutedPlayers);
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    async function deleteItem(item: GloballyMutedPlayer): Promise<void> {
      confirm("Are you sure you want to delete this item?") &&
      await adminStore.deleteGlobalMute(item);
      loadMutes();
    }

    function close(): void {
      dialog.value = false;
      showConfirmation.value = false;
    }

    async function save(): Promise<void> {
      close();
      const mute = { battleTag: player.value, expiresAt: selectedDateString.value, author: author.value } as GlobalMute;
      await adminStore.addGlobalMute(mute);
      loadMutes();
    }

    async function loadMutes(): Promise<void> {
      if (isAdmin.value) {
        await adminStore.loadGlobalMutes(searchQuery.value, mutesNextId.value);
      }
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await loadMutes();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    const clearDate = (): void => {
      selectedDate.value = undefined;
      selectedDateString.value = "";
    };

    function searchCleared(): void {
      showConfirmation.value = false;
      clearDate();
    }


    function playerFound(bTag: string): void {
      showConfirmation.value = true;
      player.value = bTag;
    }

    watch(dialog, onDialogToggled);
    function onDialogToggled(): void {
      // Only trigger on dialog close, not dialog open
      if (!dialog.value) {
        searchCleared();
        playerSearchStore.clearPlayerSearch();
      }
    }

    const headers: DataTableHeader[] = [
      {
        title: "Flo Ban Id",
        sortable: true,
        value: "id",
      },
      {
        title: "BattleTag",
        sortable: true,
        value: "battleTag",
      },
      {
        title: "Ban Insert Date",
        sortable: true,
        value: "createdAt",
      },
      {
        title: "Ban Expiry Date",
        sortable: true,
        value: "expiresAt",
      },
      {
        title: "Author",
        sortable: true,
        value: "author",
      },
      {
        title: "Actions",
        sortable: false,
        value: "actions",
      },
    ];

    const setSelectedDateString = (date: Date) => {
      selectedDateString.value = formatTimestampString(date, "yyyy-MM-dd");
    };

    return {
      mdiMagnify,
      mdiDelete,
      headers,
      globallyMutedPlayers,
      searchQuery,
      dialog,
      searchCleared,
      playerFound,
      showConfirmation,
      dateMenu,
      player,
      save,
      close,
      deleteItem,
      loadMutes,
      selectedDate,
      selectedDateString,
      setSelectedDateString,
      clearDate,
    };
  },
});
</script>
