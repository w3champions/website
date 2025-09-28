<template>
  <div>
    <v-card-title>
      Banned Players
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="bannedPlayers"
      :footer-props="{ itemsPerPageOptions: [10, 50, 100] }"
      :search="tableSearch"
      :server-items-length="bannedPlayersCount"
      :options="bannedPlayersTableOptions"
      class="elevation-1"
      item-key="banInsertDate"
      @update:options="onTableOptionsUpdate"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-text-field v-model="tableSearch" label="Search ban" :prepend-icon="mdiMagnify" />
          <v-spacer />
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ props }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="props"
              >
                {{ $t("views_admin.addplayer") }}
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">New Item</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="12" class="pb-0">
                      <player-search
                        @playerFound="playerFound"
                        @searchCleared="searchCleared"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="12" class="py-0">
                      <v-menu
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        min-width="290px"
                      >
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-model="editedItem.endDate"
                            readonly
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="props"
                          />
                        </template>
                        <v-date-picker
                          v-model="editedItem.endDate"
                          no-title
                          scrollable
                        >
                          <v-spacer />
                          <v-btn
                            text
                            @click="
                              editedItem.endDate = '';
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
                    </v-col>

                    <v-col class="py-0">
                      <v-tooltip top>
                        <template v-slot:activator="{ props }">
                          <v-select
                            v-model="editedItem.gameModes"
                            :items="activeGameModes()"
                            item-text="name"
                            item-value="id"
                            :menu-props="{ maxHeight: '400' }"
                            :label="$t(`views_admin.gameMode`)"
                            multiple
                            v-bind="props"
                            hint="Which game modes to ban from?"
                          />
                        </template>
                        <span>
                          To ban from all game modes, leave this field blank
                        </span>
                      </v-tooltip>
                    </v-col>

                    <v-col cols="12" sm="12" md="12" class="pb-0">
                      <v-text-field
                        v-model="editedItem.banReason"
                        :label="$t(`views_admin.banreason`)"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-alert
                v-model="isValidationError"
                type="warning"
                dense
                class="ml-4 mr-4"
              >
                {{ banValidationError }}
              </v-alert>

              <v-card-actions>
                <v-spacer />
                <v-btn text @click="close">
                  {{ $t(`views_admin.cancel`) }}
                </v-btn>
                <v-btn color="primary" class="w3-race-bg--text" @click="save">
                  {{ $t(`views_admin.save`) }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:[`item.gameModesText`]="{ item }">
        <td v-if="!isEmpty(item.gameModes)">
          <div v-for="id in item.gameModes" :key="id">{{ getGameModeName(id) }}</div>
        </td>
        <td v-else>All</td>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, nextTick, ref, watch } from "vue";
import { activeGameModes, activeGameModesWithAT, loadActiveGameModes } from "@/composables/GameModesMixin";
import { BannedPlayer, BannedPlayersGetRequest } from "@/store/admin/types";
import { EGameMode } from "@/store/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiDelete, mdiMagnify, mdiPencil } from "@mdi/js";
import isEmpty from "lodash/isEmpty";
import { dateToCurrentTimeDate } from "@/helpers/date-functions";
import { TranslateResult, useI18n } from "vue-i18n";
import debounce from "debounce";

type AdminBannedPlayersHeader = {
  text: string;
  value: string;
  sortable: boolean;
  width?: string;
  filterable: boolean;
  align?: "start" | "center" | "end";
};

export default defineComponent({
  name: "AdminBannedPlayers",
  components: {
    PlayerSearch,
  },
  setup() {
    const { t } = useI18n();
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();
    const playerSearchStore = usePlayerSearchStore();

    const dialog = ref<boolean>(false);
    const dateMenu = ref<boolean>(false);
    const tableSearch = ref<string>("");
    const foundPlayer = ref<string>("");

    const bannedPlayers = computed<BannedPlayer[]>(() => adminStore.bannedPlayers);
    const bannedPlayersCount = computed<number>(() => adminStore.bannedPlayersCount);
    const banValidationError = computed<string>(() => adminStore.banValidationError);
    const isValidationError = computed<boolean>(() => adminStore.banValidationError !== "");
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const editedItem = ref<BannedPlayer>({} as BannedPlayer);

    const SEARCH_DELAY = 500;
    const debouncedLoadBanList = debounce(loadBanList, SEARCH_DELAY);

    const bannedPlayersTableOptions = ref<any>({
      page: 1,
      itemsPerPage: 10,
      sortBy: ["banInsertDate"],
      sortDesc: [true],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    });

    const defaultItem = {
      battleTag: "",
      endDate: "",
      gameModes: [] as EGameMode[],
      isIpBan: false,
      banReason: "",
      banInsertDate: "",
      author: "",
    };

    async function onTableOptionsUpdate(dataOptions: any) {
      bannedPlayersTableOptions.value = dataOptions;
      await loadBanList();
    }

    function getGameModeName(id: EGameMode): TranslateResult {
      return activeGameModesWithAT().find((mode) => mode.id === id)?.name ?? t(`gameModes.${EGameMode[id]}`);
    }

    async function loadBanList() {
      const bannedPlayersGetRequest = formatBannedPlayersGetRequest();
      await adminStore.loadBannedPlayers(bannedPlayersGetRequest);
    }

    function formatBannedPlayersGetRequest(): BannedPlayersGetRequest {
      return {
        page: bannedPlayersTableOptions.value.page,
        itemsPerPage: bannedPlayersTableOptions.value.itemsPerPage,
        sortBy: bannedPlayersTableOptions.value.sortBy[0],
        sortDirection: bannedPlayersTableOptions.value.sortDesc[0] ? "desc" : "asc",
        search: tableSearch.value,
      };
    }

    async function deleteItem(item: BannedPlayer): Promise<void> {
      if (confirm("Are you sure you want to delete this item?")) {
        const itemCopy = { ...item };
        itemCopy.endDate = new Date().toISOString();
        itemCopy.banReason = "Ban removed";
        itemCopy.author = author.value;
        await adminStore.postBan(itemCopy);
      }
      await loadBanList();
    }

    async function save(): Promise<void> {
      editedItem.value.author = author.value;
      editedItem.value.endDate = dateToCurrentTimeDate(editedItem.value.endDate);
      editedItem.value.battleTag = foundPlayer.value;

      await adminStore.postBan(editedItem.value);

      if (!isValidationError.value) {
        close();
        await loadBanList();
        playerSearchStore.clearPlayerSearch();
      }
    }

    function close(): void {
      dialog.value = false;
    }

    async function init(): Promise<void> {
      await loadActiveGameModes();
      editedItem.value = Object.assign({}, defaultItem);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    watch(tableSearch, onTableSearch);

    // Fetching the ban list is done automatically when changing the page.
    // We need to set the page to 1 when searching, otherwise you could be on page 5 for instance when making a more narrow search,
    // which leaves you with an empty table.
    async function onTableSearch(): Promise<void> {
      if (bannedPlayersTableOptions.value.page === 1) {
        await debouncedLoadBanList();
      } else {
        bannedPlayersTableOptions.value.page = 1;
      }
    }

    function resetDialog(): void {
      nextTick(() => {
        editedItem.value = Object.assign({}, defaultItem);
      });
      playerSearchStore.clearPlayerSearch();
    }

    watch(dialog, onDialogToggled);
    function onDialogToggled(): void {
      // Only trigger on dialog close, not dialog open
      if (!dialog.value) {
        adminStore.resetBanValidationMessage();
        resetDialog();
        playerSearchStore.clearPlayerSearch();
      }
    }

    function playerFound(bTag: string): void {
      foundPlayer.value = bTag;
    }

    function searchCleared(): void {
      foundPlayer.value = "";
    }

    const headers: AdminBannedPlayersHeader[] = [
      { text: "BattleTag", value: "battleTag", sortable: true, width: "10vw", filterable: true },
      { text: "Ban End Date", value: "endDate", sortable: true, width: "10vw", filterable: false },
      { text: "Ban Insert Date", value: "banInsertDate", sortable: true, width: "10vw", filterable: false },
      { text: "Game modes", value: "gameModesText", sortable: false, width: "10vw", filterable: false },
      { text: "IP ban", value: "isIpBan", sortable: false, width: "5vw", filterable: false },
      { text: "Author", value: "author", sortable: true, width: "10vw", filterable: true },
      { text: "Ban reason", value: "banReason", sortable: false, filterable: false },
      { text: "Actions", value: "actions", sortable: false, filterable: false, width: "1vw", align: "center" },
    ];

    return {
      mdiDelete,
      mdiMagnify,
      mdiPencil,
      headers,
      bannedPlayers,
      bannedPlayersCount,
      tableSearch,
      dialog,
      playerFound,
      searchCleared,
      editedItem,
      dateMenu,
      activeGameModes,
      isValidationError,
      banValidationError,
      close,
      isEmpty,
      getGameModeName,
      save,
      deleteItem,
      onTableOptionsUpdate,
      bannedPlayersTableOptions,
    };
  },
});
</script>
