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
        <v-dialog max-width="1185" v-model="dialogNews">
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="primary"
              class="mb-2 w3-race-bg--text"
              v-bind="attrs"
              v-on="on"
            >
              {{ $t("views_admin.addnews") }}
            </v-btn>
          </template>
          <v-card>
            <v-card-title>
              <span class="headline">{{ formTitle() }}</span>
            </v-card-title>

            <v-card-text>
              <v-text-field
                v-model="editedNewsItem.date"
                filled
                :label="$t(`views_admin.headline`)"
              />
              <div class="editor">
                <editor-menu-bar
                  :editor="editor"
                  v-slot="{ commands, isActive }"
                >
                  <div class="menubar">
                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.bold() }"
                      @click="commands.bold"
                    >
                      <v-icon>mdi-format-bold</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.italic() }"
                      @click="commands.italic"
                    >
                      <v-icon>mdi-format-italic</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.strike() }"
                      @click="commands.strike"
                    >
                      <v-icon>mdi-format-strikethrough</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.underline() }"
                      @click="commands.underline"
                    >
                      <v-icon>mdi-format-underline</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.code() }"
                      @click="commands.code"
                    >
                      <v-icon>mdi-code-tags</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': isActive.paragraph() }"
                      @click="commands.paragraph"
                    >
                      <v-icon>mdi-format-paragraph</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.heading({ level: 1 }),
                      }"
                      @click="commands.heading({ level: 1 })"
                    >
                      <v-icon>mdi-format-header-1</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.heading({ level: 2 }),
                      }"
                      @click="commands.heading({ level: 2 })"
                    >
                      <v-icon>mdi-format-header-2</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.heading({ level: 3 }),
                      }"
                      @click="commands.heading({ level: 3 })"
                    >
                      <v-icon>mdi-format-header-3</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.bullet_list(),
                      }"
                      @click="commands.bullet_list"
                    >
                      <v-icon>mdi-format-list-bulleted</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.ordered_list(),
                      }"
                      @click="commands.ordered_list"
                    >
                      <v-icon>mdi-format-list-numbered</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.blockquote(),
                      }"
                      @click="commands.blockquote"
                    >
                      <v-icon>mdi-format-quote-close</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      @click="showImagePrompt(commands.image)"
                    >
                      <v-icon>mdi-file-image</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{
                        'is-active': isActive.code_block(),
                      }"
                      @click="commands.code_block"
                    >
                      <v-icon>mdi-code-tags</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      @click="commands.horizontal_rule"
                    >
                      hr
                    </button>

                    <button class="menubar__button" @click="commands.undo">
                      <v-icon>mdi-undo</v-icon>
                    </button>

                    <button class="menubar__button" @click="commands.redo">
                      <v-icon>mdi-redo</v-icon>
                    </button>
                  </div>
                </editor-menu-bar>

                <editor-content class="editor__content" :editor="editor" />
              </div>
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text @click="closeNews">
                {{ $t(`views_admin.cancel`) }}
              </v-btn>
              <v-btn color="primary" class="w3-race-bg--text" @click="saveNews">
                {{ $t(`views_admin.save`) }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-toolbar>
    </template>
    <template #[`item.actions`]="{ item }">
      <v-icon small class="mr-2" @click="editNewsItem(item)">mdi-pencil</v-icon>
      <v-icon small @click="deleteNewsItem(item)">mdi-delete</v-icon>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Watch } from "vue-property-decorator";
import { NewsMessage } from "@/store/admin/types";
import { Editor, EditorContent, EditorMenuBar } from "tiptap";
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Image,
  Link,
  Strike,
  Underline,
  History,
} from "tiptap-extensions";

@Component({ components: { EditorContent, EditorMenuBar } })
export default class AdminNewsForLauncher extends Vue {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  data() {
    return {
      headersNews: [
        { text: "Headline", align: "start", value: "date" },
        { text: "Text", value: "message", align: "start" },
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

  private editor = new Editor({
    extensions: [
      new Blockquote(),
      new BulletList(),
      new CodeBlock(),
      new HardBreak(),
      new Heading({ levels: [1, 2, 3] }),
      new HorizontalRule(),
      new ListItem(),
      new OrderedList(),
      new TodoItem(),
      new TodoList(),
      new Link(),
      new Image(),
      new Bold(),
      new Code(),
      new Italic(),
      new Strike(),
      new Underline(),
      new History(),
    ],
    content: "",
  });

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
    this.editor.setContent(item.message);
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

  async saveNews() {
    this.editedNewsItem.message = this.editor.getHTML();
    await this.$store.direct.dispatch.admin.editNews(this.editedNewsItem);
    this.dialogNews = false;
    this.editor.clearContent();
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }

  closeNews(): void {
    this.dialogNews = false;
    this.editedNewsItem = { bsonId: "", date: "", message: "" };
  }

  showImagePrompt(command: any) {
    // TODO Use a dialog instead of a browser prompt.
    const src = prompt("Enter the url of your image here");
    if (src !== null) {
      command({ src });
    }
  }

  async mounted() {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
