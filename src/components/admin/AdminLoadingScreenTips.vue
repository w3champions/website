<template>
  <div>
    <v-card-title>
      Loading Screen Tips
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="tips"
      :items-per-page="10"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-spacer></v-spacer>
          <v-dialog v-model="dialog">
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
                <span class="text-h5">{{ formTitle }}</span>
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
        <v-icon small class="mr-2" @click="editTipItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteTipItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref, watch } from "vue";
import { format } from "date-fns";
import { LoadingScreenTip } from "@/store/admin/infoMessages/types";
import { useOauthStore } from "@/store/oauth/store";
import { useInfoMessagesStore } from "@/store/admin/infoMessages/store";
import { mdiDelete, mdiPencil } from "@mdi/js";

export default defineComponent({
  name: "AdminLoadingScreenTips",
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const infoMessagesStore = useInfoMessagesStore();
    const dialog = ref<boolean>(false);
    const editedIndex = ref<number>(-1);
    const editedTipItem = ref<LoadingScreenTip>({} as LoadingScreenTip);

    const tips: ComputedRef<LoadingScreenTip[]> = computed((): LoadingScreenTip[] => infoMessagesStore.tips);
    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);
    const formTitle: ComputedRef<string> = computed((): string => editedIndex.value === -1 ? "New Item" : "Edit Item");

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

    const headers = [
      { text: "Author", value: "author" },
      { text: "Creation Date", value: "creationDate" },
      { text: "Text", value: "message" },
      { text: "Actions", value: "actions", sortable: false },
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
