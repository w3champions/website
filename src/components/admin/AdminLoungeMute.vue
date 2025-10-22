<template>
  <div>
    <v-card-title>
      Lounge Mute
    </v-card-title>
    <v-container>
      <v-data-table
        :headers="headers"
        :items-per-page="-1"
        :items="loungeMutes"
        :sort-by="[{ key: 'insertDate', order: 'desc' }]"
      >
        <template v-slot:top>
          <v-toolbar flat color="transparent">
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
                  <v-container>
                    <v-row>
                      <player-search
                        classes="ml-5 mr-5"
                        @searchCleared="searchCleared"
                        @playerFound="playerFound"
                      />
                    </v-row>
                    <v-row v-if="showConfirmation" class="ma-2">
                      <v-menu
                        v-model="dateMenu"
                        :close-on-content-click="false"
                        min-width="290px"
                      >
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-model="endDate"
                            readonly
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="props"
                          />
                        </template>
                        <v-date-picker v-model="endDate" no-title scrollable max="2099-01-01">
                          <v-spacer />
                          <v-btn
                            variant="text"
                            @click="
                              endDate = '';
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

                      <v-row>
                        <v-col>
                          <v-text-field
                            v-model="reason"
                            :label="'Reason'"
                            variant="outlined"
                            density="compact"
                          />
                        </v-col>
                      </v-row>

                      <v-row>
                        <v-col>
                          <v-checkbox
                            v-model="isShadowBan"
                            :label="'Shadow Ban (user can connect but messages are only visible to them)'"
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

                    <v-row>
                      <v-col>
                        <v-btn
                          v-if="showConfirmation && isMuteEndDateSet"
                          color="primary"
                          class="w3-race-bg--text"
                          @click="save"
                        >
                          {{ $t(`views_admin.ok`) }}
                        </v-btn>
                      </v-col>
                      <v-col class="text-right">
                        <v-btn
                          color="primary"
                          class="w3-race-bg--text"
                          @click="close"
                        >
                          {{ $t(`views_admin.cancel`) }}
                        </v-btn>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>
              </v-card>
            </v-dialog>
          </v-toolbar>
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
import { dateToCurrentTimeDate } from "@/helpers/date-functions";
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
    const endDate = ref<string>("");
    const reason = ref<string>("");
    const isShadowBan = ref<boolean>(false);

    const loungeMutes = computed<LoungeMuteResponse[]>(() => loungeMuteStore.loungeMutedPlayers);
    const isMuteEndDateSet = computed<boolean>(() => endDate.value != "");
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
        endDate: dateToCurrentTimeDate(endDate.value),
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


    function searchCleared(): void {
      showConfirmation.value = false;
      endDate.value = "";
      reason.value = "";
      isShadowBan.value = false;
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

    return {
      mdiDelete,
      headers,
      loungeMutes,
      dialog,
      searchCleared,
      playerFound,
      showConfirmation,
      dateMenu,
      endDate,
      battleTag,
      reason,
      isShadowBan,
      isMuteEndDateSet,
      save,
      close,
      deleteItem,
    };
  },
});
</script>

<style lang="scss" scoped>
.container {
  max-width: 1300px;
}
</style>
