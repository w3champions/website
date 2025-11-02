<template>
  <div>
    <v-card-title class="pt-3">
      Loading Screen Tips
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="tips"
      :items-per-page="10"
      class="elevation-1"
      :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
    >
      <template v-slot:top>
        <div class="d-flex align-center px-4">
          <v-spacer />
          <v-dialog v-model="dialog">
            <template v-slot:activator="{ props }">
              <v-btn
                class="bg-primary text-w3-race-bg"
                v-bind="props"
              >
                Add Tip
              </v-btn>
            </template>
            <v-card>
              <v-card-title class="pt-3">
                {{ formTitle }}
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-textarea
                    v-model="editedTipItem.message"
                    auto-grow
                    variant="filled"
                    rows="1"
                    label="Message"
                    color="primary"
                  />
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="closeTips">Cancel</v-btn>
                <v-btn
                  class="bg-primary text-w3-race-bg"
                  variant="text"
                  @click="saveTips"
                >
                  {{ $t(`views_admin.save`) }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon size="small" class="mr-2" @click="editTipItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon size="small" @click="deleteTipItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { format } from "date-fns";
import { LoadingScreenTip } from "@/store/admin/infoMessages/types";
import { useOauthStore } from "@/store/oauth/store";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { mdiDelete, mdiPencil } from "@mdi/js";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminLoadingScreenTips",
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const infoMessagesStore = useInfoMessagesStore();
    const dialog = ref<boolean>(false);
    const editedIndex = ref<number>(-1);
    const editedTipItem = ref<LoadingScreenTip>({} as LoadingScreenTip);

    const tips = computed<LoadingScreenTip[]>(() => infoMessagesStore.tips);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);
    const formTitle = computed<string>(() => editedIndex.value === -1 ? "New Item" : "Edit Item");

    const defaultTipItem: LoadingScreenTip = {
      message: "",
      author: "",
      creationDate: "",
      bsonId: "",
    };

    function editTipItem(item: LoadingScreenTip): void {
      editedTipItem.value = item;
      dialog.value = true;
    }

    async function deleteTipItem(item: LoadingScreenTip): Promise<void> {
      confirm("Are you sure you want to delete this item?") &&
        (await infoMessagesStore.deleteTip(item));
      dialog.value = false;
    }



    async function saveTips(): Promise<void> {
      editedTipItem.value.author = oauthStore.blizzardVerifiedBtag;
      editedTipItem.value.creationDate = format(new Date(), "MMMM do yyyy, h:mm:ss a");

      if (await infoMessagesStore.editTip(editedTipItem.value)) {
        dialog.value = false;
        editedTipItem.value = Object.assign({}, defaultTipItem);
      }
    }

    function closeTips(): void {
      dialog.value = false;
      editedTipItem.value = Object.assign({}, defaultTipItem);
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await infoMessagesStore.loadTips();
      editedTipItem.value = Object.assign({}, defaultTipItem);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    const headers: DataTableHeader[] = [
      { title: "Author", value: "author", sortable: true },
      { title: "Creation Date", value: "creationDate", sortable: true },
      { title: "Text", value: "message", sortable: true },
      { title: "Actions", value: "actions", sortable: false },
    ];

    return {
      mdiDelete,
      mdiPencil,
      headers,
      tips,
      dialog,
      formTitle,
      editedTipItem,
      closeTips,
      saveTips,
      editTipItem,
      deleteTipItem,
    };
  },
});
</script>
