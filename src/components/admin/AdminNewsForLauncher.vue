<template>
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
              {{ $t("views_admin.addnews") }}
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
                  :label="$t(`views_admin.headline`)"
                />
                <v-textarea
                  auto-grow
                  filled
                  rows="1"
                  v-model="editedNewsItem.message"
                  :label="$t(`views_admin.message`)"
                />
              </v-container>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="blue darken-1" text @click="closeNews">
                {{ $t(`views_admin.cancel`) }}
              </v-btn>
              <v-btn color="blue darken-1" text @click="saveNews">
                {{ $t(`views_admin.save`) }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-icon small class="mr-2" @click="editNewsItem(item)">mdi-pencil</v-icon>
      <v-icon small @click="deleteNewsItem(item)">mdi-delete</v-icon>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { NewsMessage } from "@/store/admin/types";

@Component({ components: {} })
export default class AdminNewsForLauncher extends Vue {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  data() {
    return {
      headersNews: [
        { text: "Text", value: "message", align: "start" },
        { text: "Headline", align: "start", value: "date" },
        { text: "Actions", value: "actions", sortable: false },
      ],
    };
  }

  get news(): NewsMessage[] {
    return this.$store.direct.state.admin.news;
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
      await this.$store.direct.dispatch.admin.loadNews();
    }
  }

  public dialogNews = false;
  public dateMenu = false;
  public editedIndex = -1;
  public date = "";

  public editedNewsItem = {
    bsonId: "",
    message: "",
    date: "",
  };

  editNewsItem(item: NewsMessage): void {
    this.editedNewsItem = item;
    this.dialogNews = true;
  }

  async deleteNewsItem(item: NewsMessage): Promise<void> {
    confirm("Are you sure you want to delete this item?") &&
      (await this.$store.direct.dispatch.admin.deleteNews(item));
    this.dialogNews = false;
  }

  formTitle(): string {
    return this.editedIndex === -1 ? "New Item" : "Edit Item";
  }

  async saveNews(): Promise<void> {
    await this.$store.direct.dispatch.admin.editNews(this.editedNewsItem);
    this.dialogNews = false;
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }

  closeNews(): void {
    this.dialogNews = false;
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
