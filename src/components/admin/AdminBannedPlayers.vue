<template>
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
              prepend-icon="mdi-magnify"
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
                          :items="gameModesEnumValues"
                          item-text="text"
                          item-value="value"
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

                  <v-col cols="12" sm="6" md="12" class="py-0">
                    <v-checkbox
                      v-model="editedItem.isOnlyChatBan"
                      :label="$t(`views_admin.onlybannedchat`)"
                    />
                  </v-col>

                  <v-col cols="12" sm="6" md="12" class="py-0">
                    <v-checkbox
                      v-if="isAddDialog"
                      v-model="banSmurfs"
                      :label="$t(`views_admin.bansmurfs`)"
                      @change="getSmurfs(banSmurfs)"
                    />
                  </v-col>

                  <v-col cols="12" sm="6" md="12" class="py-0">
                    <div v-if="banSmurfs">
                      <div>{{ hasSmurfs ? "The following battletags will be banned:" : "No smurfs found." }}</div>
                      <div v-for="smurf in editedItem.smurfs" :key="smurf">{{ smurf }}</div>
                    </div>
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
      <td style="white-space: pre-line">{{ getGametypeText(item.gameModes) }}</td>
    </template>
    <template #[`item.actions`]="{ item }">
      <v-icon small class="mr-2" @click="editItem(item)">mdi-pencil</v-icon>
      <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { BannedPlayer } from "@/store/admin/types";
import { EGameMode } from "@/store/typings";
import { LocaleMessage } from "vue-i18n";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";

@Component({ components: { PlayerSearch } })
export default class AdminBannedPlayers extends Vue {
  private oauthStore = useOauthStore();
  public gameModesEnumValues = this.translateGametypes();
  public banSmurfs = false;
  public dialog = false;
  public dateMenu = false;
  public editedIndex = -1;
  public tableSearch = "";
  public foundPlayer = "";

  public async getSmurfs(checked: boolean) {
    if (!checked) {
      this.resetSmurfs();
      return;
    }

    const bTag = this.foundPlayer;
    if (bTag) {
      const smurfs = await this.$store.direct.dispatch.admin.getAltsForPlayer(bTag);
      this.editedItem.smurfs = smurfs.map((smurf) => smurf.toLowerCase());
    }
  }

  get hasSmurfs() {
    return this.editedItem.smurfs ? this.editedItem.smurfs.length > 0 : false;
  }

  public headers = [
    { text: "BattleTag", align: "start", value: "battleTag", width: "10vw" },
    { text: "Ban End Date", value: "endDate", width: "8vw", filterable: false },
    { text: "Ban Insert Date", value: "banInsertDate", width: "10vw", sortBy: "asc", filterable: false },
    { text: "Only chat ban", value: "isOnlyChatBan", width: "7vw", filterable: false },
    { text: "Game modes", value: "gameModesText", sortable: false, width: "9vw", filterable: false },
    { text: "IP ban", value: "isIpBan", width: "5vw", filterable: false },
    { text: "Author", value: "author", width: "10vw", filterable: false },
    { text: "Ban reason", value: "banReason", filterable: false },
    { text: "Actions", value: "actions", sortable: false, filterable: false },
  ];


  public translateGametypes(): {
    text: LocaleMessage;
    value: string | EGameMode;
  }[] {
    const translatedEnums = [] as {
      text: LocaleMessage;
      value: string | EGameMode;
    }[];

    const keys = Object.keys(EGameMode).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (k) => typeof EGameMode[k as any] === "number"
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values = keys.map((k) => EGameMode[k as any]);

    keys.shift();
    values.shift();

    for (const item in keys) {
      translatedEnums.push({
        text: this.$t(`gameModes.${keys[item]}`),
        value: values[item],
      });
    }
    return translatedEnums;
  }

  getGametypeText(gameModes: number[]): string {
    if (!gameModes || gameModes.length === 0) {
      return this.$t(`gameModes.UNDEFINED`).toString();
    }

    let stringBuilder = "";
    gameModes.forEach((element) => {
      const gameMode = this.gameModesEnumValues.find((o) => o.value === element) || undefined;
      if (gameMode) {
        stringBuilder = stringBuilder + this.$t(`gameModes.${EGameMode[element]}`) + "\n";
      }
    });

    return stringBuilder;
  }

  get bannedPlayers(): BannedPlayer[] {
    return this.$store.direct.state.admin.players;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  get isAddDialog() {
    return this.editedIndex === -1;
  }

  get banValidationError(): string {
    return this.$store.direct.state.admin.banValidationError;
  }

  get isValidationError(): boolean {
    return this.$store.direct.state.admin.banValidationError !== "";
  }

  get searchedPlayers() {
    return this.$store.direct.state.admin.searchedPlayers
      .map((player) => player.battleTag);
  }

  get author() {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  public async loadBanList() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadBannedPlayers();
    }
  }

  public editedItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: "",
    smurfs: [] as string[],
    banInsertDate: "",
    author: "",
  };

  public defaultItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: "",
    smurfs: [] as string[],
    banInsertDate: "",
    author: "",
  };

  editItem(item: BannedPlayer): void {
    this.editedIndex = this.bannedPlayers.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.dialog = true;
  }

  async deleteItem(item: BannedPlayer): Promise<void> {
    confirm("Are you sure you want to delete this item?") && await this.$store.direct.dispatch.admin.deleteBan(item);
    await this.loadBanList();
  }

  formTitle(): string {
    return this.isAddDialog ? "New Item" : "Edit Item";
  }

  async save(): Promise<void> {
    this.editedItem.author = this.author;
    if (this.isAddDialog) {
      this.editedItem.battleTag = this.foundPlayer;
    }

    await this.$store.direct.dispatch.admin.postBan(this.editedItem);

    if (!this.isValidationError) {
      this.close();
      await this.loadBanList();
      if (this.isAddDialog) {
        this.resetPlayerSearch();
      }
    }
  }

  close(): void {
    this.dialog = false;
  }

  async mounted(): Promise<void> {
    await this.loadBanList();
  }

  resetDialog(): void {
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
      this.resetSmurfs();
    });
    this.resetPlayerSearch();
  }

  resetSmurfs(): void {
    this.banSmurfs = false;
    this.editedItem.smurfs = [];
  }

  resetPlayerSearch(): void {
    this.foundPlayer = "";
    this.$store.direct.dispatch.admin.clearSearch();
  }

  @Watch("dialog")
  onDialogToggled(): void {
    // Only trigger on dialog close, not dialog open
    if (!this.dialog) {
      this.$store.direct.dispatch.admin.resetBanValidationMessage();
      this.resetDialog();
    }
  }

  playerFound(bTag: string): void {
    this.foundPlayer = bTag;

    // Reset smurfs to avoid the possibility of smurfs being sent for the wrong player.
    if (this.banSmurfs) {
      this.resetSmurfs();
    }
  }
}
</script>

<style lang="scss"></style>
