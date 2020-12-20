<template>
  <v-container v-show="isAdmin">
    <v-card tile>
      <v-card-title>Administration Page</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="bannedPlayers"
          :items-per-page="5"
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="transparent">
              <v-toolbar-title>Banned Players</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-dialog v-model="dialog" max-width="500px">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn color="primary" class="mb-2" v-bind="attrs" v-on="on">
                    Add Player
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
                                label="Ban End Date"
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
                                color="primary"
                                @click="
                                  editedItem.endDate = '';
                                  dateMenu = false;
                                "
                              >
                                Cancel
                              </v-btn>
                              <v-btn
                                text
                                color="primary"
                                @click="dateMenu = false"
                              >
                                OK
                              </v-btn>
                            </v-date-picker>
                          </v-menu>
                        </v-col>
                        <v-col cols="12" sm="6" md="12">
                          <v-checkbox
                            v-model="editedItem.isOnlyChatBan"
                            label="Is only banned from chat"
                          />
                        </v-col>
                        <v-col cols="12" sm="12" md="12">
                          <v-text-field
                            v-model="editedItem.banReason"
                            label="Ban Reason"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="close">
                      Cancel
                    </v-btn>
                    <v-btn color="blue darken-1" text @click="save">Save</v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteItem(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
      <v-card-text>
        <v-data-table
          :headers="headersNews"
          :items="news"
          :items-per-page="5"
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="transparent">
              <v-toolbar-title>News for Launcher</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-dialog v-model="dialogNews">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn color="primary" class="mb-2" v-bind="attrs" v-on="on">
                    Add News
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline">{{ formTitle() }}</span>
                  </v-card-title>

                  <v-card-text>
                    <v-container>
                      <v-text-field
                        v-model="editedNewsItem.date"
                        filled
                        label="Headline"
                      />
                      <v-textarea
                        auto-grow
                        filled
                        rows="1"
                        v-model="editedNewsItem.message"
                        label="Message"
                      />
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeNews">
                      Cancel
                    </v-btn>
                    <v-btn color="blue darken-1" text @click="saveNews">
                      Save
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editNewsItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteNewsItem(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>

      <v-card-text>
        <v-data-table
          :headers="headersTips"
          :items="tips"
          :items-per-page="5"
          class="elevation-1"
        >
          <template v-slot:top>
            <v-toolbar flat color="transparent">
              <v-toolbar-title>Loading screen tips</v-toolbar-title>
              <v-spacer></v-spacer>
              <v-dialog v-model="dialogTips">
                <template v-slot:activator="{ on, attrs }">
                  <v-btn color="primary" class="mb-2" v-bind="attrs" v-on="on">
                    Add Tip
                  </v-btn>
                </template>
                <v-card>
                  <v-card-title>
                    <span class="headline">{{ formTitle() }}</span>
                  </v-card-title>

                  <v-card-text>
                    <v-container>
                      <v-textarea
                        auto-grow
                        filled
                        rows="1"
                        v-model="editedTipItem.message"
                        label="Message"
                      />
                    </v-container>
                  </v-card-text>

                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeTips">
                      Cancel
                    </v-btn>
                    <v-btn color="blue darken-1" text @click="saveTips">
                      Save
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
            </v-toolbar>
          </template>
          <template v-slot:item.actions="{ item }">
            <v-icon small class="mr-2" @click="editTipItem(item)">
              mdi-pencil
            </v-icon>
            <v-icon small @click="deleteTipItem(item)">mdi-delete</v-icon>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import store from "@/store";
import moment from "moment";
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import {
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
} from "../store/admin/types";
@Component({ components: {} })
export default class Admin extends Vue {
  data() {
    return {
      headers: [
        {
          text: "BattleTag",
          align: "start",
          sortable: false,
          value: "battleTag",
        },
        { text: "Ban End Date", value: "endDate" },
        { text: "Is only banned from chat?", value: "isOnlyChatBan" },
        { text: "Ban reason", value: "banReason" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      headersNews: [
        {
          text: "Id",
          align: "start",
          value: "bsonId",
        },
        { text: "Text", value: "message", align: "start" },
        { text: "Date", align: "start", value: "date" },
        { text: "Actions", value: "actions", sortable: false },
      ],
      headersTips: [
        {
          text: "Author",
          align: "start",
          value: "author",
        },
        { text: "Creation Date", align: "start", value: "creationDate" },
        { text: "Text", value: "message", align: "start" },
        { text: "Actions", value: "actions", sortable: false },
      ],
    };
  }

  get bannedPlayers() {
    return this.$store.direct.state.admin.players;
  }

  get news() {
    return this.$store.direct.state.admin.news;
  }

  get tips() {
    return this.$store.direct.state.admin.tips;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged() {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.admin.loadBannedPlayers();
      await this.$store.direct.dispatch.admin.loadNews();
      await this.$store.direct.dispatch.admin.loadTips();
    }
  }

  public dialog = false;
  public dialogNews = false;
  public dialogTips = false;
  public dateMenu = false;
  public editedIndex = -1;
  public date = "";

  public editedTipItem = {
    message: "",
    author: "",
    creationDate: "",
    bsonId: "",
  };
  public editedNewsItem = {
    bsonId: "",
    message: "",
    date: "",
  };
  public editedItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    banReason: "",
  };
  public defaultItem = {
    battleTag: "",
    endDate: "",
    isOnlyChatBan: false,
    banReason: "",
  };

  editItem(item: BannedPlayer) {
    this.editedIndex = this.bannedPlayers.indexOf(item);

    if (this.editedIndex === -1) {
      this.editedItem = this.defaultItem;
    } else {
      this.editedItem = Object.assign({}, item);
    }
    this.dialog = true;
  }

  editNewsItem(item: NewsMessage) {
    this.editedNewsItem = item;
    this.dialogNews = true;
  }

  editTipItem(item: LoadingScreenTip) {
    this.editedTipItem = item;
    this.dialogTips = true;
  }

  async deleteItem(item: BannedPlayer) {
    const index = this.bannedPlayers.indexOf(item);
    confirm("Are you sure you want to delete this item?") &&
      this.bannedPlayers.splice(index, 1);
    await this.$store.direct.dispatch.admin.deleteBan(item);
  }

  async deleteNewsItem(item: NewsMessage) {
    confirm("Are you sure you want to delete this item?") &&
      (await this.$store.direct.dispatch.admin.deleteNews(item));
    this.dialogNews = false;
  }

  async deleteTipItem(item: LoadingScreenTip) {
    confirm("Are you sure you want to delete this item?") &&
      (await this.$store.direct.dispatch.admin.deleteTip(item));
    this.dialogTips = false;
  }

  formTitle() {
    return this.editedIndex === -1 ? "New Item" : "Edit Item";
  }

  async save() {
    if (this.editedIndex > -1) {
      Object.assign(this.bannedPlayers[this.editedIndex], this.editedItem);
    } else {
      this.bannedPlayers.push(this.editedItem);
    }
    await this.$store.direct.dispatch.admin.postBan(this.editedItem);

    this.close();
  }

  close() {
    this.dialog = false;
    this.$nextTick(() => {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.editedIndex = -1;
    });
  }

  async saveNews() {
    await this.$store.direct.dispatch.admin.editNews(this.editedNewsItem);
    this.dialogNews = false;
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }

  closeNews() {
    this.dialogNews = false;
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }
  async saveTips() {
    this.editedTipItem.author = this.$store.direct.state.oauth.blizzardVerifiedBtag;
    this.editedTipItem.creationDate = moment().format(
      "MMMM Do YYYY, h:mm:ss a"
    );
    if (await this.$store.direct.dispatch.admin.editTip(this.editedTipItem)) {
      this.dialogTips = false;
      this.editedTipItem = {
        message: "",
        author: "",
        creationDate: "",
        bsonId: "",
      };
    }
  }

  closeTips() {
    this.dialogTips = false;
    this.editedTipItem = {
      message: "",
      author: "",
      creationDate: "",
      bsonId: "",
    };
  }
  async mounted() {
    await this.init();
  }
}
</script>
