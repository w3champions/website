<template>
  <div>
    <v-card-title class="pt-3">
      Lounge Mute
    </v-card-title>
    <v-container style="max-width: 1300px;">
      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="loungeMutes"
        :sort-by="[{ key: 'insertDate', order: 'desc' }]"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mb-2 bg-primary text-w3-race-bg"
                  v-bind="props"
                >
                  {{ $t(`views_admin.mutePlayer`) }}
                </v-btn>
              </template>

              <v-card>
                <v-card-title class="pt-3">
                  {{ $t(`views_admin.mutePlayer`) }}
                </v-card-title>

                <v-card-text class="pt-0">
                  <v-container class="pa-0">
                    <v-col class="pb-7">
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
                            color="primary"
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
                          <template v-slot:actions>
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
                              class="bg-primary text-w3-race-bg"
                              @click="dateMenu = false"
                            >
                              {{ $t(`views_admin.ok`) }}
                            </v-btn>
                          </template>
                        </v-date-picker>
                      </v-menu>

                      <v-row>
                        <v-col>
                          <v-text-field
                            v-model="reason"
                            :label="'Reason'"
                            variant="underlined"
                            color="primary"
                            density="compact"
                            hide-details
                          />
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col>
                          <v-checkbox
                            v-model="isShadowBan"
                            :label="'Shadow Ban (user can connect but messages are only visible to them)'"
                            hide-details
                          />
                        </v-col>
                      </v-row>

                      <v-card-text>
                        Are you sure you want to mute this player?
                      </v-card-text>
                      <v-card-title>
                        {{ battleTag }}
                        <v-spacer />
                      </v-card-title>
                    </v-row>

                    <v-row class="mx-1">
                      <v-col>
                        <v-btn
                          class="bg-primary text-w3-race-bg"
                          @click="close"
                        >
                          {{ $t(`views_admin.cancel`) }}
                        </v-btn>
                      </v-col>
                      <v-col class="text-right">
                        <v-btn
                          v-if="showConfirmation && selectedDate"
                          class="bg-primary text-w3-race-bg"
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
          </div>
        </template>

        <template v-slot:[`item.isShadowBan`]="{ item }">
          {{ item.isShadowBan ? 'Yes' : 'No' }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-icon size="small" @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { LoungeMute, LoungeMuteResponse } from "@/store/admin/loungeMute/types";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useOauthStore } from "@/store/oauth/store";
import { useLoungeMuteStore } from "@/store/admin/loungeMute/store";
import { usePlayerSearchStore } from "@/store/playerSearch/store";
import { mdiDelete } from "@mdi/js";
import { dateToCurrentTimeDate, formatTimestampString } from "@/helpers/date-functions";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminLoungeMute",
  components: {
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const loungeMuteStore = useLoungeMuteStore();
    const playerSearchStore = usePlayerSearchStore();

    const dateMenu = ref<boolean>(false);
    const dialog = ref<boolean>(false);
    const showConfirmation = ref<boolean>(false);
    const battleTag = ref<string>("");
    const reason = ref<string>("");
    const isShadowBan = ref<boolean>(false);
    const selectedDate = ref<Date>();
    const selectedDateString = ref<string>("");

    const loungeMutes = computed<LoungeMuteResponse[]>(() => loungeMuteStore.loungeMutedPlayers);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);

    async function deleteItem(item: LoungeMute): Promise<void> {
      confirm("Are you sure you want to delete this item?") &&
      await loungeMuteStore.deleteLoungeMute(item.battleTag);
      loadMutes();
    }

    function close(): void {
      dialog.value = false;
      showConfirmation.value = false;
    }

    async function save(): Promise<void> {
      close();

      const mute = {
        battleTag: battleTag.value,
        author: author.value,
        endDate: dateToCurrentTimeDate(selectedDateString.value),
        reason: reason.value,
        isShadowBan: isShadowBan.value,
      } as LoungeMute;

      await loungeMuteStore.addLoungeMute(mute);
      loadMutes();
    }

    async function loadMutes(): Promise<void> {
      if (isAdmin.value) {
        await loungeMuteStore.loadLoungeMutes();
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
      reason.value = "";
      isShadowBan.value = false;
      clearDate();
    }

    function playerFound(bTag: string): void {
      showConfirmation.value = true;
      battleTag.value = bTag;
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
      { title: "BattleTag", sortable: true, value: "battleTag" },
      { title: "Mute End Date", sortable: true, value: "endDate" },
      { title: "Mute Insert Date", sortable: true, value: "insertDate" },
      { title: "Author", sortable: true, value: "author" },
      { title: "Reason", sortable: true, width: "17vw", value: "reason" },
      { title: "Shadow Ban", sortable: true, value: "isShadowBan" },
      { title: "Actions", sortable: false, value: "actions", align: "center" },
    ];

    const setSelectedDateString = (date: Date) => {
      selectedDateString.value = formatTimestampString(date, "yyyy-MM-dd");
    };

    return {
      mdiDelete,
      headers,
      loungeMutes,
      dialog,
      searchCleared,
      playerFound,
      showConfirmation,
      dateMenu,
      battleTag,
      reason,
      isShadowBan,
      save,
      close,
      deleteItem,
      selectedDate,
      selectedDateString,
      setSelectedDateString,
      clearDate,
    };
  },
});
</script>
