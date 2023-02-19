<template>
  <v-data-table
    :headers="headers"
    :items="bannedPlayers"
    :items-per-page="-1"
    class="elevation-1"
  >
    <template v-slot:top>
      <v-toolbar flat color="transparent">
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
            <v-tabs v-model="tabsModel">
              <v-tab v-for="tab of tabs" :key="tab.id" @click="loadBanList(tab.id)">{{ tab.text }}</v-tab>
            </v-tabs>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle() }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="12" class="pb-0">
                    <!-- Autocomplete Btag search -->
                    <v-autocomplete
                      v-if="isAddDialog"
                      v-model="searchPlayerModel"
                      append-icon="mdi-magnify"
                      label="Search BattleTag"
                      clearable
                      placeholder=" "
                      :items="searchedPlayers"
                      :search-input.sync="search"
                      @click:clear="resetPlayerSearch"
                      autofocus
                    ></v-autocomplete>
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
                      :label="$t(`views_admin.banSmurfs`)"
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

@Component({ components: {} })
export default class AdminBannedPlayers extends Vue {
  public gameModesEnumValues = this.translateGametypes();
  public tabsModel = 0;
  public oldSearchTerm = "";
  public searchPlayerModel = "";
  public search = "";
  public banSmurfs = false;

  public async getSmurfs(checked: boolean) {
    if (!checked) return;

    const bTag = this.searchPlayerModel;
    if (bTag) {
      const smurfs = await this.$store.direct.dispatch.admin.getAltsForPlayer(bTag);
      this.editedItem.smurfs = smurfs.map((smurf) => smurf.toLowerCase());
    }
  }

  get hasSmurfs() {
    return this.editedItem.smurfs ? this.editedItem.smurfs.length > 0 : false;
  }

  public tabs = [
    { text: "Active bans", id: 0 },
    { text: "Inactive bans", id: 1 }
  ];

  public headers = [
    { text: "BattleTag", align: "start", sortable: false, value: "battleTag" },
    { text: "Ban End Date", value: "endDate", width: "8vw" },
    { text: "Is only banned from chat?", value: "isOnlyChatBan" },
    { text: "Game modes", value: "gameModesText", sortable: false, width: "10vw" },
    { text: "Is IP banned?", value: "isIpBan" },
    { text: "Ban reason", value: "banReason" },
    { text: "Actions", value: "actions", sortable: false },
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
      (k) => typeof EGameMode[k as any] === "number"
    );
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
    return this.$store.direct.state.oauth.isAdmin;
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

  public async loadBanList(tab: number) {
    const active = tab === 0 ? true : false;
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadBannedPlayers(active);
    }
  }

  public dialog = false;
  public dateMenu = false;
  public editedIndex = -1;

  public editedItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: "",
    smurfs: [] as string[],
  };
  public defaultItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: "",
    smurfs: [] as string[],
  };

  editItem(item: BannedPlayer): void {
    this.editedIndex = this.bannedPlayers.indexOf(item);
    this.editedItem = Object.assign({}, item);
    this.dialog = true;
  }

  async deleteItem(item: BannedPlayer): Promise<void> {
    const index = this.bannedPlayers.indexOf(item);
    confirm("Are you sure you want to delete this item?") &&
      this.bannedPlayers.splice(index, 1);
    await this.$store.direct.dispatch.admin.deleteBan(item);
    await this.loadBanList(this.tabsModel);
  }

  formTitle(): string {
    return this.isAddDialog ? "New Item" : "Edit Item";
  }

  async save(): Promise<void> {
    if (this.isAddDialog) {
      this.editedItem.battleTag = this.searchPlayerModel;
    }

    await this.$store.direct.dispatch.admin.postBan(this.editedItem);

    if (!this.isValidationError) {
      this.close();
      await this.loadBanList(this.tabsModel);
      if (this.isAddDialog) {
        this.resetPlayerSearch();
      }
    }
  }

  close(): void {
    this.dialog = false;
  }

  async mounted(): Promise<void> {
    await this.loadBanList(this.tabsModel);
  }

  resetDialog(): void {
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
    this.resetPlayerSearch();
  }

  resetPlayerSearch(): void {
    this.oldSearchTerm = "";
    this.searchPlayerModel = "";
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

  @Watch("search")
  public async onSearchChanged(newValue: string): Promise<void> {
    if (newValue && newValue.length > 2 && newValue !== this.oldSearchTerm) {
      await this.$store.direct.dispatch.admin.searchBnetTag({
        searchText: newValue.toLowerCase(),
      });
      this.oldSearchTerm = newValue;
    } else {
      this.resetPlayerSearch();
    }
  }
}
</script>

<style lang="scss"></style>
