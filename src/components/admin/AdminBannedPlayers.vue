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
                <span class="text-h5">{{ formTitle() }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12" sm="6" md="12" class="pb-0">
                      <player-search
                        v-if="isAddDialog"
                        @playerFound="playerFound"
                        @searchCleared="searchCleared"
                        :clearSearchFromParent="clearPlayerSearchToggle"
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
                        <template #activator="{ on, attrs }">
                          <v-text-field
                            v-model="editedItem.endDate"
                            readonly
                            :label="$t(`views_admin.banenddate`)"
                            v-bind="attrs"
                            v-on="on"
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
      <template #[`item.gameModesText`]="{ item }">
        <td v-if="!isEmpty(item.gameModes)">
          <div v-for="id in item.gameModes" :key="id">{{ getGameModeName(id) }}</div>
        </td>
        <td v-else>All</td>
      </template>
      <template #[`item.actions`]="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import { BannedPlayer } from "@/store/admin/types";
import { EGameMode } from "@/store/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";
import { mdiDelete, mdiMagnify, mdiPencil } from "@mdi/js";
import isEmpty from "lodash/isEmpty";
import { dateToCurrentTimeDate } from "@/helpers/date-functions";

@Component({ components: { PlayerSearch } })
export default class AdminBannedPlayers extends Mixins(GameModesMixin) {
  private oauthStore = useOauthStore();
  public dialog = false;
  public dateMenu = false;
  public editedIndex = -1;
  public tableSearch = "";
  public foundPlayer = "";
  public clearPlayerSearchToggle = false;
  private adminStore = useAdminStore();
  public mdiDelete = mdiDelete;
  public mdiMagnify = mdiMagnify;
  public mdiPencil = mdiPencil;
  public isEmpty = isEmpty;

  public headers = [
    { text: "BattleTag", align: "start", value: "battleTag", width: "10vw" },
    { text: "Ban End Date", value: "endDate", width: "10vw", filterable: false },
    { text: "Ban Insert Date", value: "banInsertDate", width: "10vw", sortBy: "asc", filterable: false },
    { text: "Game modes", value: "gameModesText", sortable: false, width: "10vw", filterable: false },
    { text: "IP ban", value: "isIpBan", width: "5vw", filterable: false },
    { text: "Author", value: "author", width: "10vw", filterable: false },
    { text: "Ban reason", value: "banReason", filterable: false },
    { text: "Actions", value: "actions", sortable: false, filterable: false },
  ];

  getGameModeName(id: EGameMode) {
    return this.activeGameModesWithAT.find((mode) => mode.id === id)?.name ?? this.$t(`gameModes.${EGameMode[id]}`);
  }

  // For a new ban, only allow active game modes to be chosen.
  // If you're editing a ban, and they are banned from an inactive game mode, add those the list, to allow deselecting them.
  get selectableGameModes() {
    const bannedModesForEditedItem = this.editedItem.gameModes;
    const activeModeIds = this.activeGameModes.map((mode) => mode.id);
    const bannedInactiveModesForEditedItem = bannedModesForEditedItem
      .filter((mode) => !activeModeIds.includes(mode))
      .map((id) => {
        return {
          id,
          name: this.$t(`gameModes.${EGameMode[id]}`)
        };
      });
    const activeModes = this.activeGameModes;

    return activeModes.concat(bannedInactiveModesForEditedItem);
  }

  get bannedPlayers(): BannedPlayer[] {
    return this.adminStore.bannedPlayers;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  get isAddDialog() {
    return this.editedIndex === -1;
  }

  get banValidationError(): string {
    return this.adminStore.banValidationError;
  }

  get isValidationError(): boolean {
    return this.adminStore.banValidationError !== "";
  }

  get searchedPlayers() {
    return this.adminStore.searchedPlayers
      .map((player) => player.battleTag);
  }

  get author() {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  public async loadBanList() {
    if (this.isAdmin) {
      await this.adminStore.loadBannedPlayers();
    }
  }

  get authCode(): string {
    return this.oauthStore.token;
  }

  public editedItem = {
    battleTag: "",
    endDate: "",
    gameModes: [] as EGameMode[],
    isIpBan: false,
    banReason: "",
    banInsertDate: "",
    author: "",
  };

  public defaultItem = {
    battleTag: "",
    endDate: "",
    gameModes: [] as EGameMode[],
    isIpBan: false,
    banReason: "",
    banInsertDate: "",
    author: "",
  };

  editItem(item: BannedPlayer): void {
    this.editedIndex = this.bannedPlayers.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.dialog = true;
  }

  async deleteItem(item: BannedPlayer): Promise<void> {
    confirm("Are you sure you want to delete this item?") && await this.adminStore.deleteBan(item);
    await this.loadBanList();
  }

  formTitle(): string {
    return this.isAddDialog ? "New Item" : "Edit Item";
  }

  async save(): Promise<void> {
    this.editedItem.author = this.author;
    if (this.endDateIsSet) {
      this.editedItem.endDate = dateToCurrentTimeDate(this.editedItem.endDate);
    }
    if (this.isAddDialog) {
      this.editedItem.battleTag = this.foundPlayer;
    }

    await this.adminStore.postBan(this.editedItem);

    if (!this.isValidationError) {
      this.close();
      await this.loadBanList();
      if (this.isAddDialog) {
        this.clearPlayerSearch();
      }
    }
  }

  close(): void {
    this.dialog = false;
  }

  @Watch("isAdmin")
  public async isAdminWatcher(): Promise<void> {
    if (isEmpty(this.bannedPlayers)) {
      await this.init();
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }

  async init(): Promise<void> {
    await this.loadBanList();
    await this.loadActiveGameModes();
  }

  resetDialog(): void {
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
    this.clearPlayerSearch();
  }

  clearPlayerSearch() {
    this.clearPlayerSearchToggle = !this.clearPlayerSearchToggle;
  }

  @Watch("dialog")
  onDialogToggled(): void {
    // Only trigger on dialog close, not dialog open
    if (!this.dialog) {
      this.adminStore.resetBanValidationMessage();
      this.resetDialog();
    }
  }

  playerFound(bTag: string): void {
    this.foundPlayer = bTag;
  }

  searchCleared(): void {
    this.foundPlayer = "";
  }

  // When adding a new ban, and when setting a new date on an edited item, endDate will have the format 'yyyy-MM-dd', which is of length 10.
  get endDateIsSet(): boolean {
    return this.editedItem.endDate.length == 10;
  }
}
</script>

<style lang="scss"></style>
