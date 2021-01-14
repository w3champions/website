<template>
  <v-data-table
    :headers="headersTips"
    :items="tips"
    :items-per-page="5"
    class="elevation-1"
  >
    <template v-slot:top>
      <v-toolbar flat color="transparent">
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
                {{ $t(`views_admin.cancel`) }}
              </v-btn>
              <v-btn color="blue darken-1" text @click="saveTips">
                {{ $t(`views_admin.save`) }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon small class="mr-2" @click="editTipItem(item)">mdi-pencil</v-icon>
      <v-icon small @click="deleteTipItem(item)">mdi-delete</v-icon>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import moment from "moment";
import {
  BannedPlayer,
  LoadingScreenTip,
  NewsMessage,
} from "@/store/admin/types";

@Component({ components: {} })
export default class AdminLoadingScreenTips extends Vue {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  data() {
    return {
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

  get tips(): LoadingScreenTip[] {
    return this.$store.direct.state.admin.tips;
  }

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init() {
    if (this.isAdmin) {
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

  editTipItem(item: LoadingScreenTip): void {
    this.editedTipItem = item;
    this.dialogTips = true;
  }

  async deleteTipItem(item: LoadingScreenTip): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
      (await this.$store.direct.dispatch.admin.deleteTip(item));
    this.dialogTips = false;
  }

  formTitle(): string {
    return this.editedIndex === -1 ? "New Item" : "Edit Item";
  }

  async saveTips(): Promise<void> {
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

  closeTips(): void {
    this.dialogTips = false;
    this.editedTipItem = {
      message: "",
      author: "",
      creationDate: "",
      bsonId: "",
    };
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
