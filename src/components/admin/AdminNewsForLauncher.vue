<template>
  <div>
    <v-card-title class="pt-3">
      News
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="news"
      :items-per-page="5"
      class="elevation-1"
      :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
    >
      <template v-slot:top>
        <div class="d-flex align-center px-4">
          <div class="text-h6">News for Launcher</div>
          <v-spacer />
          <v-dialog v-model="dialog" max-width="1185" @click:outside="closeNews">
            <template v-slot:activator="{ props }">
              <v-btn
                class="bg-primary text-w3-race-bg"
                v-bind="props"
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
                  variant="filled"
                  color="primary"
                  :label="$t(`views_admin.headline`)"
                />
                <AdminRichTextEditor v-model="editedNewsItem.message" label="News message" />
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="closeNews">
                  {{ $t(`views_admin.cancel`) }}
                </v-btn>
                <v-btn class="bg-primary text-w3-race-bg" @click="saveNews">
                  {{ $t(`views_admin.save`) }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon size="small" class="mr-2" @click="editNewsItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon size="small" @click="deleteNewsItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { NewsMessage } from "@/store/admin/infoMessages/types";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { mdiDelete, mdiPencil } from "@mdi/js";
import AdminRichTextEditor from "./editor/AdminRichTextEditor.vue";
import { linkifyAnnouncementHtml } from "@/helpers/announcementHtml";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminNewsForLauncher",
  components: {
    AdminRichTextEditor,
  },
  setup() {
    const infoMessagesStore = useInfoMessagesStore();

    const editedIndex = ref<number>(-1);

    const news = computed<NewsMessage[]>(() => infoMessagesStore.news);
    const formTitle = computed<string>(() => editedIndex.value === -1 ? "New Item" : "Edit Item");

    const dialog = ref<boolean>(false);

    const editedNewsItem = ref<NewsMessage>(createDefaultNewsMessage());

    async function init() {
      await infoMessagesStore.loadNews();
      editedNewsItem.value = createDefaultNewsMessage();
    }

    function editNewsItem(item: NewsMessage): void {
      editedNewsItem.value = { ...item };
      editedIndex.value = news.value.indexOf(item);
      dialog.value = true;
    }

    async function deleteNewsItem(item: NewsMessage): Promise<void> {
      if (confirm("Are you sure you want to delete this item?")) {
        await infoMessagesStore.deleteNews(item);
      }
      dialog.value = false;
    }

    async function saveNews() {
      editedNewsItem.value.message = linkifyAnnouncementHtml(editedNewsItem.value.message);
      await infoMessagesStore.editNews(editedNewsItem.value);
      dialog.value = false;
      editedNewsItem.value = createDefaultNewsMessage();
    }

    function closeNews(): void {
      dialog.value = false;
      editedNewsItem.value = createDefaultNewsMessage();
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

    onMounted(async (): Promise<void> => {
      await init();
    });

    const headers: DataTableHeader[] = [
      { title: "Text", value: "message" },
      { title: "Headline", value: "date" },
      { title: "Actions", value: "actions", sortable: false },
    ];

    return {
      mdiDelete,
      mdiPencil,
      headers,
      news,
      dialog,
      formTitle,
      editedNewsItem,
      closeNews,
      saveNews,
      editNewsItem,
      deleteNewsItem,
    };
  },
});
</script>
