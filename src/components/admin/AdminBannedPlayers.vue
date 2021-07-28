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
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle() }}</span>
            </v-card-title>

            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" md="12">
                    <v-text-field
                      v-model="editedItem.battleTag"
                      label="BattleTag"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="12" md="12">
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

                  <v-col>
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

                  <v-col cols="12" sm="6" md="12">
                    <v-checkbox
                      v-model="editedItem.isOnlyChatBan"
                      :label="$t(`views_admin.onlybannedchat`)"
                    />
                  </v-col>
                  <v-col cols="12" sm="12" md="12">
                    <v-text-field
                      v-model="editedItem.banReason"
                      :label="$t(`views_admin.banreason`)"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>

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

  public headers = [
        { text: "BattleTag", align: "start", sortable: false, value: "battleTag",},
        { text: "Ban End Date", value: "endDate" },
        { text: "Is only banned from chat?", value: "isOnlyChatBan" },
        { text: "Game modes", value: "gameModes" },
        { text: "Is IP banned?", value: "isIpBan" },
        { text: "Ban reason", value: "banReason" },
        { text: "Actions", value: "actions", sortable: false }
      ];

  public translateGametypes() : { text: LocaleMessage, value: string | EGameMode }[] {
    let translatedEnums = [] as { text: LocaleMessage, value: string | EGameMode }[]

    const keys = Object.keys(EGameMode).filter(k => typeof EGameMode[k as any] === "number")
    const values = keys.map(k => EGameMode[k as any])

    keys.shift()
    values.shift()

    for (let item in keys) {
      translatedEnums.push({ text: this.$t(`gameModes.${keys[item]}`), value: values[item]})
    }
    return translatedEnums;
  }

  get bannedPlayers() : BannedPlayer[] {
    return this.$store.direct.state.admin.players;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() : void {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadBannedPlayers();
    } 
  }
  
  public dialog = false;
  public dialogNews = false;
  public dialogTips = false;
  public dateMenu = false;
  public editedIndex = -1;
  public date = "";

  public editedItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: ""
  };
  public defaultItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    gameModes: [] as number[],
    isIpBan: false,
    banReason: ""
  };

  editItem(item: BannedPlayer) : void {
    this.editedIndex = this.bannedPlayers.indexOf(item);

    if (this.editedIndex === -1) {
      this.editedItem = this.defaultItem;
    } else {
      this.editedItem = Object.assign({}, item);
    }
    this.dialog = true;
  }

  async deleteItem(item: BannedPlayer) : Promise<void> {
    const index = this.bannedPlayers.indexOf(item);
    confirm("Are you sure you want to delete this item?") &&
      this.bannedPlayers.splice(index, 1);
    await this.$store.direct.dispatch.admin.deleteBan(item);
  }

  formTitle() : unknown {
    return this.editedIndex === -1 ? "New Item" : "Edit Item";
  }

  async save() : Promise<void> {
    if (this.editedIndex > -1) {
      Object.assign(this.bannedPlayers[this.editedIndex], this.editedItem);
    } else {
      this.bannedPlayers.push(this.editedItem);
    }
    await this.$store.direct.dispatch.admin.postBan(this.editedItem);

    this.close();
  }

  close() : void {
    this.dialog = false;
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  }

  async mounted() : Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
