<template>
  <div>
    <v-card-title>
      Banned Players
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="bannedPlayers"
      :items-per-page="10"
      :footer-props="{ itemsPerPageOptions: [10, 100, -1] }"
      sort-by="banInsertDate"
      :sort-desc="true"
      :search="tableSearch"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <template>
            <v-text-field
              v-model="tableSearch"
              label="Search ban"
              :prepend-icon="mdiMagnify"
            ></v-text-field>
          </template>
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="attrs"
                v-on="on"
              >
                {{ $t("views_admin.addplayer") }}
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="12" class="pb-0">
                      <player-search
                        v-if="isAddDialog"
                        @playerFound="playerFound"
                        @searchCleared="searchCleared"
                      ></player-search>
                      <v-text-field
                        v-else
                        v-model="editedItem.battleTag"
                        label="BattleTag"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="12" md="12" class="py-0">
                      <v-menu
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        min-width="290px"
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            v-model="editedItem.endDate"
                            readonly
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="attrs"
                            v-on="on"
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          v-model="editedItem.endDate"
                          no-title
                          scrollable
                        >
                          <v-spacer></v-spacer>
                          <v-btn
                            text
                            @click='
                              editedItem.endDate = "";
                              dateMenu = false;
                            '
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
                        <template v-slot:activator="{ on }">
                          <v-select
                            v-on="on"
                            v-model="editedItem.gameModes"
                            :items="selectableGameModes"
                            item-text="name"
                            item-value="id"
                            :menu-props="{ maxHeight: '400' }"
                            :label="$t(`views_admin.gameMode`)"
                            multiple
                            hint="Which game modes to ban from?"
                          ></v-select>
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
                      ></v-text-field>
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
                <v-spacer></v-spacer>
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
        <v-icon small class="mr-2" @click="editItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref, watch } from "vue";
import { activeGameModes, activeGameModesWithAT, IGameModeBrief, loadActiveGameModes } from "@/mixins/GameModesMixin";
import { BannedPlayer } from "@/store/admin/types";
import { EGameMode } from "@/store/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiDelete, mdiMagnify, mdiPencil } from "@mdi/js";
import isEmpty from "lodash/isEmpty";
import { dateToCurrentTimeDate } from "@/helpers/date-functions";
import { TranslateResult, useI18n } from "vue-i18n-bridge";

type AdminBannedPlayersHeader = {
  text: string;
  value: string;
  sortable: boolean;
  width?: string;
  filterable: boolean;
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
    const editedIndex = ref<number>(-1);
    const tableSearch = ref<string>("");
    const foundPlayer = ref<string>("");

    const bannedPlayers = computed<BannedPlayer[]>(() => adminStore.bannedPlayers);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    const isAddDialog = computed<boolean>(() => editedIndex.value === -1);
    const banValidationError = computed<string>(() => adminStore.banValidationError);
    const isValidationError = computed<boolean>(() => adminStore.banValidationError !== "");
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const formTitle = computed<string>(() => isAddDialog.value ? "New Item" : "Edit Item");
    const editedItem = ref<BannedPlayer>({} as BannedPlayer);

    const defaultItem = {
      battleTag: "",
      endDate: "",
      gameModes: [] as EGameMode[],
      isIpBan: false,
      banReason: "",
      banInsertDate: "",
      author: "",
    };

    // When adding a new ban, and when setting a new date on an edited item, endDate will have the format 'yyyy-MM-dd', which is of length 10.
    const endDateIsSet = computed<boolean>(() => editedItem.value.endDate.length == 10);

    function getGameModeName(id: EGameMode): TranslateResult {
      return activeGameModesWithAT().find((mode) => mode.id === id)?.name ?? t(`gameModes.${EGameMode[id]}`);
    }

    // For a new ban, only allow active game modes to be chosen.
    // If you're editing a ban, and they are banned from an inactive game mode, add those the list, to allow deselecting them.
    const selectableGameModes = computed<IGameModeBrief[]>(() => {
      const bannedModesForEditedItem = editedItem.value.gameModes;
      const activeModeIds = activeGameModes().map((mode) => mode.id);
      const bannedInactiveModesForEditedItem = bannedModesForEditedItem
        .filter((mode) => !activeModeIds.includes(mode))
        .map((id) => {
          return {
            id,
            name: `gameModes.${EGameMode[id]}`,
          };
        });
      const activeModes = activeGameModes();

      return activeModes.concat(bannedInactiveModesForEditedItem);
    });

    async function loadBanList() {
      await adminStore.loadBannedPlayers();
    }

    function editItem(item: BannedPlayer): void {
      editedIndex.value = bannedPlayers.value.indexOf(item);
      editedItem.value = Object.assign({}, item);
      dialog.value = true;
    }

    async function deleteItem(item: BannedPlayer): Promise<void> {
      confirm("Are you sure you want to delete this item?") && await adminStore.deleteBan(item);
      await loadBanList();
    }

    async function save(): Promise<void> {
      editedItem.value.author = author.value;
      if (endDateIsSet.value) {
        editedItem.value.endDate = dateToCurrentTimeDate(editedItem.value.endDate);
      }
      if (isAddDialog.value) {
        editedItem.value.battleTag = foundPlayer.value;
      }

      await adminStore.postBan(editedItem.value);

      if (!isValidationError.value) {
        close();
        await loadBanList();
        if (isAddDialog.value) {
          playerSearchStore.clearPlayerSearch();
        }
      }
    }

    function close(): void {
      dialog.value = false;
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await loadBanList();
      await loadActiveGameModes();
      editedItem.value = Object.assign({}, defaultItem);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    function resetDialog(): void {
      nextTick(() => {
        editedItem.value = Object.assign({}, defaultItem);
        editedIndex.value = -1;
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
      { text: "IP ban", value: "isIpBan", sortable: true, width: "5vw", filterable: false },
      { text: "Author", value: "author", sortable: true, width: "10vw", filterable: true },
      { text: "Ban reason", value: "banReason", sortable: true, filterable: false },
      { text: "Actions", value: "actions", sortable: false, filterable: false },
    ];

    return {
      mdiDelete,
      mdiMagnify,
      mdiPencil,
      headers,
      bannedPlayers,
      tableSearch,
      dialog,
      formTitle,
      isAddDialog,
      playerFound,
      searchCleared,
      editedItem,
      dateMenu,
      selectableGameModes,
      isValidationError,
      banValidationError,
      close,
      isEmpty,
      getGameModeName,
      save,
      editItem,
      deleteItem,
    };
  },
});
</script>
