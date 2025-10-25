<template>
  <div>
    <v-card-title>
      Ban Reason Translations
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="banReasonTranslations"
      :footer-props="{ itemsPerPageOptions: [10, 50, 100] }"
      class="elevation-1"
      item-key="_id"
    >
      <template v-slot:top>
        <v-toolbar flat color="transparent">
          <v-spacer />
          <v-dialog v-model="dialog" max-width="600px">
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                class="mb-2 w3-race-bg--text"
                v-bind="attrs"
                v-on="on"
                @click="openAddDialog"
              >
                Add Translation
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="text-h5">{{ dialogTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.translations.en"
                        label="English"
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.translations.cn"
                        label="Chinese (CN)"
                        required
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model="editedItem.translations.es"
                        label="Spanish"
                        required
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn text @click="close">
                  Cancel
                </v-btn>
                <v-btn
                  color="primary"
                  class="w3-race-bg--text"
                  :disabled="!isValid"
                  @click="save"
                >
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-icon small class="mr-2" @click="editItem(item)">{{ mdiPencil }}</v-icon>
        <v-icon small @click="deleteItem(item)">{{ mdiDelete }}</v-icon>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { BanReasonTranslation, CreateBanReasonTranslationRequest, UpdateBanReasonTranslationRequest } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import { useAdminStore } from "@/store/admin/store";
import { mdiDelete, mdiPencil } from "@mdi/js";

type AdminBanReasonTranslationsHeader = {
  text: string;
  value: string;
  sortable: boolean;
  width?: string;
  align?: "start" | "center" | "end";
};

export default defineComponent({
  name: "AdminBanReasonTranslations",
  setup() {
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();

    const dialog = ref<boolean>(false);
    const isEditMode = ref<boolean>(false);

    const banReasonTranslations = computed<BanReasonTranslation[]>(() => adminStore.banReasonTranslations);
    const author = computed<string>(() => oauthStore.blizzardVerifiedBtag);

    const defaultItem: BanReasonTranslation = {
      _id: "",
      translations: {
        en: "",
        cn: "",
        es: "",
      },
      createdBy: "",
      createdAt: "",
      updatedAt: "",
    };

    const editedItem = ref<BanReasonTranslation>({ ...defaultItem });

    const headers = ref<AdminBanReasonTranslationsHeader[]>([
      {
        text: "English",
        value: "translations.en",
        sortable: true,
      },
      {
        text: "Chinese (CN)",
        value: "translations.cn",
        sortable: true,
      },
      {
        text: "Spanish",
        value: "translations.es",
        sortable: true,
      },
      {
        text: "Created By",
        value: "createdBy",
        sortable: true,
        width: "150px",
      },
      {
        text: "Actions",
        value: "actions",
        sortable: false,
        width: "100px",
        align: "end",
      },
    ]);

    const dialogTitle = computed<string>(() => {
      return isEditMode.value ? "Edit Translation" : "Add Translation";
    });

    const isValid = computed<boolean>(() => {
      return (
        editedItem.value.translations.en.trim() !== "" &&
        editedItem.value.translations.cn.trim() !== "" &&
        editedItem.value.translations.es.trim() !== ""
      );
    });

    function openAddDialog() {
      isEditMode.value = false;
      editedItem.value = { ...defaultItem };
    }

    function editItem(item: BanReasonTranslation) {
      isEditMode.value = true;
      editedItem.value = { ...item };
      dialog.value = true;
    }

    async function deleteItem(item: BanReasonTranslation) {
      if (confirm(`Are you sure you want to delete this translation?`)) {
        await adminStore.deleteBanReasonTranslation(item._id);
      }
    }

    function close() {
      dialog.value = false;
      editedItem.value = { ...defaultItem };
    }

    async function save() {
      if (!isValid.value) return;

      if (isEditMode.value) {
        const request: UpdateBanReasonTranslationRequest = {
          translations: editedItem.value.translations,
          author: author.value,
        };
        await adminStore.updateBanReasonTranslation(editedItem.value._id, request);
      } else {
        const request: CreateBanReasonTranslationRequest = {
          translations: editedItem.value.translations,
          author: author.value,
        };
        await adminStore.createBanReasonTranslation(request);
      }
      close();
    }

    onMounted(async () => {
      await adminStore.loadBanReasonTranslations();
    });

    return {
      dialog,
      headers,
      banReasonTranslations,
      editedItem,
      dialogTitle,
      isValid,
      mdiPencil,
      mdiDelete,
      openAddDialog,
      editItem,
      deleteItem,
      close,
      save,
    };
  },
});
</script>
