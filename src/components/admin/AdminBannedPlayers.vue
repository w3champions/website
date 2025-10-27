<template>
  <div>
    <v-card-title>
      Banned Players
    </v-card-title>
    <v-data-table-server
      :headers="headers"
      :items="bannedPlayers"
      :items-per-page-options="[10, 25, 50, 100]"
      :search="tableSearch"
      :items-length="bannedPlayersCount"
      :options="bannedPlayersTableOptions"
      :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
      :sort-by="[{ key: bannedPlayersTableOptions.sortBy[0]?.key, order: bannedPlayersTableOptions.sortBy[0]?.order }]"
      item-value="banInsertDate"
      @update:options="onTableOptionsUpdate"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <div class="ml-3 w-50">
            <v-text-field
              v-model="tableSearch"
              label="Search ban"
              :prepend-inner-icon="mdiMagnify"
              color="primary"
              variant="underlined"
            />
          </div>
          <v-dialog v-model="dialog" max-width="500px">
            <template v-slot:activator="{ props }">
              <v-btn
                class="bg-primary ml-auto mr-5 text-w3-race-bg"
                v-bind="props"
              >
                {{ $t("views_admin.addplayer") }}
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                New Item
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="12">
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
                            v-model="selectedDateString"
                            readonly
                            variant="underlined"
                            color="primary"
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="props"
                          />
                        </template>
                        <v-date-picker
                          v-model="selectedDate"
                          first-day-of-week="1"
                          hide-header
                          show-adjacent-months
                          @update:modelValue="setSelectedDateString"
                        >
                          <v-spacer />
                          <v-btn
                            variant="text"
                            @click="
                              editedItem.endDate = '';
                              dateMenu = false;
                            "
                          >
                            {{ $t(`views_admin.cancel`) }}
                          </v-btn>
                          <v-btn
                            class="bg-primary text-w3-race-bg"
                            @click="dateMenu = false"
                          >
                            {{ $t(`views_admin.ok`) }}
                          </v-btn>
                        </v-date-picker>
                      </v-menu>
                    </v-col>

                    <v-col class="py-0">
                      <v-tooltip location="top" content-class="w3-tooltip elevation-1">
                        <template v-slot:activator="{ props }">
                          <v-select
                            v-model="editedItem.gameModes"
                            :items="activeGameModes()"
                            item-title="name"
                            item-value="id"
                            :menu-props="{ maxHeight: '400' }"
                            :label="$t(`views_admin.gameMode`)"
                            multiple
                            v-bind="props"
                            hint="Which game modes to ban from?"
                            variant="underlined"
                            color="primary"
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
                        variant="underlined"
                        color="primary"
                        :label="$t(`views_admin.banreason`)"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="12" class="pb-0">
                      <v-select
                        v-model="selectedTranslationId"
                        :items="translationItems"
                        item-title="label"
                        item-value="value"
                        label="User-Visible Ban Reason (Translation)"
                        clearable
                        hint="Select a predefined translation or leave empty to use free text"
                        persistent-hint
                        variant="underlined"
                        color="primary"
                      />
                    </v-col>
                    <v-col cols="12" sm="12" md="12" class="pb-0">
                      <v-text-field
                        v-model="userVisibleFreeText"
                        label="User-Visible Ban Reason (Free Text)"
                        hint="Only used if no translation is selected"
                        persistent-hint
                        variant="underlined"
                        color="primary"
                        :disabled="!!selectedTranslationId"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-alert
                v-model="isValidationError"
                type="warning"
                density="compact"
                class="ml-4 mr-4"
              >
                {{ banValidationError }}
              </v-alert>

              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="close">
                  {{ $t(`views_admin.cancel`) }}
                </v-btn>
                <v-btn class="bg-primary text-w3-race-bg" @click="save">
                  {{ $t(`views_admin.save`) }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:[`item.gameModesText`]="{ item }">
        <td v-if="!isEmpty(item.gameModes)">
          <div v-for="(id, index) in item.gameModes" :key="`${id}-${index}`">{{ getGameModeName(id) }}</div>
        </td>
        <td v-else>All</td>
      </template>
      <template v-slot:[`item.userVisibleBanReasonText`]="{ item }">
        <td>{{ getUserVisibleBanReasonText(item) }}</td>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon size="small" @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table-server>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, nextTick, ref, watch } from "vue";
import { activeGameModes, activeGameModesWithAT, loadActiveGameModes } from "@/composables/GameModesMixin";
import { BannedPlayer, BannedPlayersGetRequest, BanReasonTranslation } from "@/store/admin/types";
import { EGameMode } from "@/store/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiDelete, mdiMagnify, mdiPencil } from "@mdi/js";
import isEmpty from "lodash/isEmpty";
import { dateToCurrentTimeDate, formatTimestampString } from "@/helpers/date-functions";
import { TranslateResult, useI18n } from "vue-i18n";
import debounce from "debounce";
import { DataTableHeader } from "vuetify";
import { SortItem } from "vuetify/lib/components/VDataTable/composables/sort";

type VuetifyTableUpdateOptions = {
  page: number;
  itemsPerPage: number;
  sortBy: Array<SortItem>;
  groupBy: Array<string>;
  search: string;
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
    const selectedTranslationId = ref<string>("");
    const userVisibleFreeText = ref<string>("");

    const bannedPlayers = computed<BannedPlayer[]>(() => adminStore.bannedPlayers);
    const bannedPlayersCount = computed<number>(() => adminStore.bannedPlayersCount);
    const banValidationError = computed<string>(() => adminStore.banValidationError);
    const isValidationError = computed<boolean>(() => adminStore.banValidationError !== "");
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const editedItem = ref<BannedPlayer>({} as BannedPlayer);
    const selectedDate = ref<Date>();
    const selectedDateString = ref<string>("");

    const banReasonTranslations = computed<BanReasonTranslation[]>(() => adminStore.banReasonTranslations);

    const translationItems = computed(() => {
      return banReasonTranslations.value.map((t) => ({
        label: t.translations.en,
        value: t._id,
      }));
    });

    const SEARCH_DELAY = 500;
    const debouncedLoadBanList = debounce(loadBanList, SEARCH_DELAY);

    // https://vuetifyjs.com/en/api/v-data-table-server/
    const bannedPlayersTableOptions = ref<VuetifyTableUpdateOptions>({
      page: 1,
      itemsPerPage: 10,
      sortBy: [{ key: "banInsertDate", order: "desc" }],
      groupBy: [],
      search: "",
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

    // TODO: Only debounce the request when you're searching, not when you're doing something else,
    // like changing the sort key, sort order or page.
    async function onTableOptionsUpdate(dataOptions: VuetifyTableUpdateOptions) {
      bannedPlayersTableOptions.value = dataOptions;
      await debouncedLoadBanList();
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
        sortBy: bannedPlayersTableOptions.value.sortBy[0]?.key,
        sortDirection: bannedPlayersTableOptions.value.sortBy[0]?.order,
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
      editedItem.value.endDate = dateToCurrentTimeDate(selectedDateString.value);
      editedItem.value.battleTag = foundPlayer.value;

      // Build userVisibleBanReason
      if (selectedTranslationId.value) {
        editedItem.value.userVisibleBanReason = {
          translationId: selectedTranslationId.value,
        };
      } else if (userVisibleFreeText.value.trim()) {
        editedItem.value.userVisibleBanReason = {
          freeText: userVisibleFreeText.value.trim(),
        };
      } else {
        editedItem.value.userVisibleBanReason = undefined;
      }

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
      await adminStore.loadBanReasonTranslations();
      editedItem.value = Object.assign({}, defaultItem);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    // watch(tableSearch, onTableSearch);

    // Fetching the ban list is done automatically when changing the page.
    // We need to set the page to 1 when searching, otherwise you could be on page 5 for instance when making a more narrow search,
    // which leaves you with an empty table.
    // async function onTableSearch(): Promise<void> {
    //   if (bannedPlayersTableOptions.value.page === 1) {
    //     await debouncedLoadBanList();
    //   } else {
    //     bannedPlayersTableOptions.value.page = 1;
    //   }
    // }

    function resetDialog(): void {
      nextTick(() => {
        editedItem.value = Object.assign({}, defaultItem);
      });
      selectedTranslationId.value = "";
      userVisibleFreeText.value = "";
      playerSearchStore.clearPlayerSearch();
    }

    watch(dialog, onDialogToggled);
    function onDialogToggled(): void {
      // Only trigger on dialog close, not dialog open
      if (!dialog.value) {
        adminStore.resetBanValidationMessage();
        resetDialog();
        playerSearchStore.clearPlayerSearch();
        foundPlayer.value = "";
        selectedDateString.value = "";
      }
    }

    function playerFound(bTag: string): void {
      foundPlayer.value = bTag;
    }

    function searchCleared(): void {
      foundPlayer.value = "";
    }

    function getUserVisibleBanReasonText(item: BannedPlayer): string {
      if (!item.userVisibleBanReason) {
        return "-";
      }
      if (item.userVisibleBanReason.freeText) {
        return item.userVisibleBanReason.freeText;
      }
      if (item.userVisibleBanReason.translationId) {
        const translation = banReasonTranslations.value.find(
          (t) => t._id === item.userVisibleBanReason?.translationId
        );
        if (translation) {
          return translation.translations.en;
        }
        return `[Translation not found: ${item.userVisibleBanReason.translationId}]`;
      }
      return "-";
    }

    const headers: DataTableHeader[] = [
      { title: "BattleTag", value: "battleTag", sortable: true, width: "10vw" },
      { title: "Ban End Date", value: "endDate", sortable: true, width: "10vw" },
      { title: "Ban Insert Date", value: "banInsertDate", sortable: true, width: "10vw" },
      { title: "Game modes", value: "gameModesText", sortable: false, width: "10vw" },
      { title: "IP ban", value: "isIpBan", sortable: false, width: "5vw" },
      { title: "Author", value: "author", sortable: true, width: "10vw" },
      { title: "Ban reason", value: "banReason", sortable: false },
      { title: "User-Visible Ban Reason", value: "userVisibleBanReasonText", sortable: false, width: "15vw" },
      { title: "Actions", value: "actions", sortable: false, width: "1vw", align: "center" },
    ];

    const setSelectedDateString = (date: Date) => {
      selectedDateString.value = formatTimestampString(date, "yyyy-MM-dd");
    };

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
      getUserVisibleBanReasonText,
      save,
      deleteItem,
      onTableOptionsUpdate,
      bannedPlayersTableOptions,
      selectedDate,
      selectedDateString,
      setSelectedDateString,
      selectedTranslationId,
      userVisibleFreeText,
      translationItems,
    };
  },
});
</script>
