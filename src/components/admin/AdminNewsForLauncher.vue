<template>
  <div>
    <v-card-title>
      News
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="news"
      :items-per-page="5"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-toolbar-title>News for Launcher</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-dialog max-width="1185" v-model="dialog" @click:outside="closeNews">
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
                <span class="text-h5">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-text-field
                  v-model="editedNewsItem.date"
                  filled
                  :label="$t(`views_admin.headline`)"
                />
                <div class="editor">
                  <div class="menubar">
                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('bold') }"
                      :disabled="!editor.can().chain().focus().toggleBold().run()"
                      @click="editor.chain().focus().toggleBold().run()"
                    >
                      <v-icon>{{ mdiFormatBold }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('italic') }"
                      :disabled="!editor.can().chain().focus().toggleItalic().run()"
                      @click="editor.chain().focus().toggleItalic().run()"
                    >
                      <v-icon>{{ mdiFormatItalic }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('strike') }"
                      :disabled="!editor.can().chain().focus().toggleStrike().run()"
                      @click="editor.chain().focus().toggleStrike().run()"
                    >
                      <v-icon>{{ mdiFormatStrikethrough }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('underline') }"
                      :disabled="!editor.can().chain().focus().toggleUnderline().run()"
                      @click="editor.chain().focus().toggleUnderline().run()"
                    >
                      <v-icon>{{ mdiFormatUnderline }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('code') }"
                      :disabled="!editor.can().chain().focus().toggleCode().run()"
                      @click="editor.chain().focus().toggleCode().run()"
                    >
                      <v-icon>{{ mdiCodeTags }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('paragraph') }"
                      @click="editor.chain().focus().setParagraph().run()"
                    >
                      <v-icon>{{ mdiFormatParagraph }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
                      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
                    >
                      <v-icon>{{ mdiFormatHeader1 }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
                      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
                    >
                      <v-icon>{{ mdiFormatHeader2 }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
                      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
                    >
                      <v-icon>{{ mdiFormatHeader3 }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('bulletList') }"
                      @click="editor.chain().focus().toggleBulletList().run()"
                    >
                      <v-icon>{{ mdiFormatListBulleted }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :class="{ 'is-active': editor.isActive('orderedList') }"
                      @click="editor.chain().focus().toggleOrderedList().run()"
                    >
                      <v-icon>{{ mdiFormatListNumbered }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      @click="showImagePrompt()"
                    >
                      <v-icon>{{ mdiFileImage }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      @click="editor.chain().focus().setHorizontalRule().run()"
                    >
                      <v-icon>{{ mdiMinus }}</v-icon>
                      hr
                    </button>

                    <button
                      class="menubar__button"
                      :disabled="!editor.can().chain().focus().undo().run()"
                      @click="editor.chain().focus().undo().run()"
                    >
                      <v-icon>{{ mdiUndo }}</v-icon>
                    </button>

                    <button
                      class="menubar__button"
                      :disabled="!editor.can().chain().focus().redo().run()"
                      @click="editor.chain().focus().redo().run()"
                    >
                      <v-icon>{{ mdiRedo }}</v-icon>
                    </button>
                  </div>
                </div>

                <editor-content class="editor__content" :editor="editor" />
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
        <v-icon small class="mr-2" @click="editNewsItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteNewsItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>

  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, onUnmounted, ref } from "vue";
import { NewsMessage } from "@/store/admin/infoMessages/types";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import {
  mdiCodeTags,
  mdiDelete,
  mdiFileImage,
  mdiFormatBold,
  mdiFormatHeader1,
  mdiFormatHeader2,
  mdiFormatHeader3,
  mdiFormatItalic,
  mdiFormatListBulleted,
  mdiFormatListNumbered,
  mdiFormatParagraph,
  mdiFormatQuoteClose,
  mdiFormatStrikethrough,
  mdiFormatUnderline,
  mdiMinus,
  mdiPencil,
  mdiRedo,
  mdiUndo,
} from "@mdi/js";
import { Editor, EditorContent } from "@tiptap/vue-2";
import { Document } from "@tiptap/extension-document";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { History } from "@tiptap/extension-history";
import { Strike } from "@tiptap/extension-strike";
import { Underline } from "@tiptap/extension-underline";
import { Italic } from "@tiptap/extension-italic";
import { Bold } from "@tiptap/extension-bold";
import { Code } from "@tiptap/extension-code";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { BulletList } from "@tiptap/extension-bullet-list";
import { ListItem } from "@tiptap/extension-list-item";
import { Heading } from "@tiptap/extension-heading";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { OrderedList } from "@tiptap/extension-ordered-list";
import { Dropcursor } from "@tiptap/extension-dropcursor";

export default defineComponent({
  name: "AdminNewsForLauncher",
  components: {
    EditorContent,
  },
  props: {},
  setup() {
    const infoMessagesStore = useInfoMessagesStore();

    const editedIndex = ref<number>(-1);

    const news: ComputedRef<NewsMessage[]> = computed((): NewsMessage[] => infoMessagesStore.news);
    const formTitle: ComputedRef<string> = computed((): string => editedIndex.value === -1 ? "New Item" : "Edit Item");

    const dialog = ref<boolean>(false);

    const editedNewsItem = ref<NewsMessage>({} as NewsMessage);

    const editor = new Editor({
      extensions: [
        Document,
        Paragraph,
        Text,
        BulletList,
        ListItem,
        Heading.configure({ levels: [1, 2, 3] }),
        HorizontalRule,
        OrderedList,
        Link,
        Image,
        Bold,
        Code,
        Italic,
        Strike,
        Underline,
        History,
        Dropcursor,
      ],
      content: "",
    });

    async function init() {
      await infoMessagesStore.loadNews();
      editedNewsItem.value = createDefaultNewsMessage();
    }

    function editNewsItem(item: NewsMessage): void {
      editedNewsItem.value = item;
      editedIndex.value = news.value.indexOf(item);
      editor.chain().focus().setContent(item.message).run();
      dialog.value = true;
    }

    async function deleteNewsItem(item: NewsMessage): Promise<void> {
      confirm("Are you sure you want to delete this item?") &&
      (await infoMessagesStore.deleteNews(item));
      dialog.value = false;
    }

    async function saveNews() {
      editedNewsItem.value.message = editor.getHTML();
      await infoMessagesStore.editNews(editedNewsItem.value);
      dialog.value = false;
      editor.chain().focus().clearContent().run();
      editedNewsItem.value = createDefaultNewsMessage();
    }

    function closeNews(): void {
      dialog.value = false;
      editedNewsItem.value = createDefaultNewsMessage();
      editor.chain().focus().setContent("").run();
      editedIndex.value = -1;
    }

    function createDefaultNewsMessage(): NewsMessage {
      const newsMessage: NewsMessage = {
        message: "",
        date: "",
        bsonId: "",
      };

      return newsMessage;
    }

    function showImagePrompt() {
      // TODO Use a dialog instead of a browser prompt.
      const url = window.prompt("Enter the url of your image here");
      if (url) {
        editor.chain().focus().setImage({ src: url, alt: "" }).run();
      }
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    onUnmounted((): void => {
      editor.destroy();
    });

    const headers = [
      { text: "Text", value: "message" },
      { text: "Headline", value: "date" },
      { text: "Actions", value: "actions", sortable: false },
    ];

    return {
      mdiDelete,
      mdiPencil,
      mdiFormatItalic,
      mdiFormatStrikethrough,
      mdiFormatUnderline,
      mdiFormatBold,
      mdiCodeTags,
      mdiFormatParagraph,
      mdiFormatHeader1,
      mdiFormatHeader2,
      mdiFormatHeader3,
      mdiFormatListBulleted,
      mdiFormatListNumbered,
      mdiFormatQuoteClose,
      mdiFileImage,
      mdiUndo,
      mdiRedo,
      mdiMinus,
      headers,
      news,
      dialog,
      formTitle,
      editedNewsItem,
      editor,
      showImagePrompt,
      closeNews,
      saveNews,
      editNewsItem,
      deleteNewsItem,
    };
  },
});
</script>
