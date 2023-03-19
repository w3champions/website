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
            <v-btn
              color="primary"
              class="mb-2 w3-race-bg--text"
              v-bind="attrs"
              v-on="on"
            >
              Add Tip
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="text-h5">{{ formTitle() }}</span>
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
              <v-btn text @click="closeTips">Cancel</v-btn>
              <v-btn
                color="primary"
                class="w3-race-bg--text primary"
                text
                @click="saveTips"
              >
                {{ $t(`views_admin.save`) }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template #[`item.actions`]="{ item }">
      <v-icon small class="mr-2" @click="editTipItem(item)">mdi-pencil</v-icon>
      <v-icon small @click="deleteTipItem(item)">mdi-delete</v-icon>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { format } from "date-fns";
import { LoadingScreenTip } from "@/store/admin/messages/types";
import { useOauthStore } from "@/store/oauth/store";

@Component({ components: {} })
export default class AdminLoadingScreenTips extends Vue {
  private oauthStore = useOauthStore();
  data(): unknown {
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
    return this.$store.direct.state.infoMessages.tips;
  }

  get isAdmin(): boolean {
    return this.oauthStore.isAdmin;
  }

  @Watch("isAdmin")
  onBattleTagChanged(): void {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.isAdmin) {
      await this.$store.direct.dispatch.infoMessages.loadTips();
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
      (await this.$store.direct.dispatch.infoMessages.deleteTip(item));
    this.dialogTips = false;
  }

  formTitle(): unknown {
    return this.editedIndex === -1 ? "New Item" : "Edit Item";
  }

  async saveTips(): Promise<void> {
    this.editedTipItem.author = this.oauthStore.blizzardVerifiedBtag;
    this.editedTipItem.creationDate = format(new Date(), "MMMM do yyyy, h:mm:ss a");

    if (await this.$store.direct.dispatch.infoMessages.editTip(this.editedTipItem)) {
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
