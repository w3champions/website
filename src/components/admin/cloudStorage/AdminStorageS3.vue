<template>
  <div>
    <v-card-title>
      Manage S3 Files
    </v-card-title>
    <v-container>
      <v-data-table
        :headers="headers"
        :items-per-page="10"
        :footer-props="{ itemsPerPageOptions: [10, 100, -1] }"
        :items="files"
        :sort-by="[{ key: 'lastModified', order: 'desc' }]"
        :search="tableSearch"
        :loading="isLoadingFiles"
        loading-text="Loading... Please wait"
        :header-props="{ class: ['w3-gray-text', 'font-weight-bold'] }"
      >
        <template v-slot:top>
          <v-toolbar flat color="transparent">
            <v-text-field
              v-model="tableSearch"
              variant="underlined"
              color="primary"
              label="Search"
              :prepend-inner-icon="mdiMagnify"
            />
            <v-spacer />
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ props }">
                <v-btn
                  class="mb-2 bg-primary text-w3-race-bg"
                  v-bind="props"
                >
                  Upload Image
                </v-btn>
              </template>

              <v-card>
                <v-card-title>
                  Upload Image
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-col cols="12" sm="6" md="12" class="pb-0">
                        <v-file-input
                          v-model="fileToUpload"
                          :prepend-icon="mdiCamera"
                          accept="image/*"
                          label="Select an image"
                        />
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" :disabled="isUploadingFile" @click="close">
                    {{ $t(`views_admin.cancel`) }}
                  </v-btn>
                  <v-btn class="bg-primary text-w3-race-bg" :disabled="isUploadingFile" @click="uploadFile">
                    {{ isUploadingFile ? "Uploading..." : "Upload" }}
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-toolbar>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-icon size="small" class="mr-3" @click="downloadFile(item)">{{ mdiDownload }}</v-icon>
          <v-icon size="small" @click="deleteFile(item)">{{ mdiDelete }}</v-icon>
        </template>
      </v-data-table>
      <v-snackbar v-model="isValidationMessageVisible" location="top" :color="validationMessage.isSuccess ? 'green' : 'red accent-2'">
        {{ validationMessage.message }}
        <template v-slot:actions="{ isActive }">
          <v-btn color="black" variant="text" v-bind="isActive" @click="resetValidationMessage">
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { useCloudStorageStore } from "@/store/admin/cloudStorage/store";
import { useOauthStore } from "@/store/oauth/store";
import { mdiDelete, mdiDownload, mdiCamera, mdiMagnify } from "@mdi/js";
import { CloudFile, CloudValidationMessage, CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { DataTableHeader } from "vuetify";

export default defineComponent({
  name: "AdminStorageS3",
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const cloudStorageStore = useCloudStorageStore();
    const dialog = ref<boolean>(false);
    const fileToUpload = ref<File | null>(null);
    const isValidationMessageVisible = ref<boolean>(false);
    const tableSearch = ref<string>("");
    const isLoadingFiles = ref<boolean>(true);
    const isUploadingFile = ref<boolean>(false);

    const files = computed<CloudFile[]>(() => cloudStorageStore.files);
    const validationMessage = computed<CloudValidationMessage>(() => cloudStorageStore.validationMessage);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    function resetValidationMessage() {
      isValidationMessageVisible.value = false;
      cloudStorageStore.validationMessage = { message: "", isSuccess: true };
    }

    async function deleteFile(file: CloudFile): Promise<void> {
      const confirmation = confirm(`Are you sure you want to delete ${file.name}?`);
      if (!confirmation) return;
      await cloudStorageStore.deleteFile(file.name, CloudStorageProvider.S3);
      isValidationMessageVisible.value = true;
      await loadFiles();
    }

    function downloadFile(file: CloudFile): void {
      cloudStorageStore.downloadFile(file.name, CloudStorageProvider.S3);
    }

    async function uploadFile(): Promise<void> {
      if (!fileToUpload.value) return;
      isUploadingFile.value = true;
      await cloudStorageStore.uploadFile(fileToUpload.value, CloudStorageProvider.S3);
      isValidationMessageVisible.value = true;
      close();
      isUploadingFile.value = false;
      fileToUpload.value = null;
      await loadFiles();
    }

    function close(): void {
      dialog.value = false;
    }

    async function loadFiles(): Promise<void> {
      await cloudStorageStore.fetchFiles(CloudStorageProvider.S3);
      isLoadingFiles.value = false;
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      cloudStorageStore.resetFiles();
      resetValidationMessage();
      await loadFiles();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    const headers: DataTableHeader[] = [
      { title: "Name", sortable: true, value: "name" },
      { title: "Size (KB)", sortable: true, value: "size" },
      { title: "Last Modified", sortable: true, value: "lastModified" },
      { title: "Actions", sortable: false, value: "actions" },
    ];

    return {
      mdiDelete,
      mdiDownload,
      mdiCamera,
      mdiMagnify,
      headers,
      files,
      tableSearch,
      isLoadingFiles,
      dialog,
      fileToUpload,
      close,
      isUploadingFile,
      uploadFile,
      downloadFile,
      deleteFile,
      isValidationMessageVisible,
      validationMessage,
      resetValidationMessage,
    };
  },
});
</script>
