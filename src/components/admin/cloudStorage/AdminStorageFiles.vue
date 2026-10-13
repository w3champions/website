<template>
  <div>
    <v-card-title class="pt-3">
      Manage {{ providerLabel }} Files
    </v-card-title>
    <v-container class="w3-container-width">
      <v-alert v-if="loadError" type="error" class="mb-4">
        {{ loadError }}
        <v-btn class="ml-3" variant="outlined" :loading="isLoadingFiles" @click="loadFiles">Retry</v-btn>
      </v-alert>
      <v-alert v-if="statusError" type="warning" density="compact" class="mb-3">
        Portrait status could not be checked. {{ statusError }}
        <v-btn variant="outlined" class="ml-3" @click="refreshPortraitStatuses">Retry status</v-btn>
      </v-alert>
      <p v-if="!loadError" class="text-caption text-medium-emphasis mb-2">Previews use the website’s public image URL.</p>
      <v-data-table
        v-if="!loadError"
        :headers="headers"
        :items-per-page="10"
        :items-per-page-options="[10, 25, 100]"
        :items="files"
        :sort-by="[{ key: 'lastModified', order: 'desc' }]"
        :search="tableSearch"
        :loading="isLoadingFiles"
        loading-text="Loading... Please wait"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        @update:current-items="loadPortraitStatuses"
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-text-field
              v-model="tableSearch"
              variant="underlined"
              color="primary"
              label="Search"
              :prepend-inner-icon="mdiMagnify"
            />
            <v-spacer />
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ props: activator }">
                <v-btn
                  class="mb-2 bg-primary text-w3-race-bg"
                  v-bind="activator"
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
                        <file-drop-zone :model-value="fileToUpload ? [fileToUpload] : []" accept="image/*" label="Drag & drop an image here" :disabled="isUploadingFile" @update:model-value="fileToUpload = $event[0] ?? null" />
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
          </div>
        </template>
        <template v-slot:item.preview="{ item }">
          <img
            v-if="previewUrl(item) && !failedPreviews.has(item.name)"
            :src="previewUrl(item)"
            :alt="`Preview of ${item.name}`"
            loading="lazy"
            decoding="async"
            width="64"
            height="64"
            class="storage-preview"
            @error="failedPreviews.add(item.name)"
          />
          <span v-else class="text-caption text-medium-emphasis">No preview</span>
        </template>
        <template v-slot:item.size="{ item }">
          <v-tooltip location="top" :text="preciseStorageSize(item)">
            <template v-slot:activator="{ props: activator }">
              <span v-bind="activator" tabindex="0" class="storage-metadata">{{ compactStorageSize(item) }}</span>
            </template>
          </v-tooltip>
        </template>
        <template v-slot:item.lastModified="{ item }">
          <v-tooltip location="top" max-width="420" :text="preciseStorageDate(item.lastModified)">
            <template v-slot:activator="{ props: activator }">
              <time v-bind="activator" tabindex="0" class="storage-metadata" :datetime="storageDateTimestamp(item.lastModified)">{{ compactStorageDate(item.lastModified) }}</time>
            </template>
          </v-tooltip>
        </template>
        <template v-slot:item.status="{ item }">
          <div v-if="storedPortraitId(item) !== null" class="storage-status">
            <template v-if="portraitStatuses[storedPortraitId(item)!]">
              <v-tooltip location="top" :text="portraitStatuses[storedPortraitId(item)!].inCatalogue ? 'In portrait catalogue' : 'Not in portrait catalogue'">
                <template v-slot:activator="{ props: activator }">
                  <v-icon v-bind="activator" role="img" :aria-hidden="false" tabindex="0" size="small" :color="portraitStatuses[storedPortraitId(item)!].inCatalogue ? 'primary' : 'grey'" :aria-label="portraitStatuses[storedPortraitId(item)!].inCatalogue ? 'In portrait catalogue' : 'Not in portrait catalogue'">{{ portraitStatuses[storedPortraitId(item)!].inCatalogue ? mdiBookCheckOutline : mdiBookOffOutline }}</v-icon>
                </template>
              </v-tooltip>
              <v-tooltip location="top" max-width="340" :text="usageText(portraitStatuses[storedPortraitId(item)!])">
                <template v-slot:activator="{ props: activator }">
                  <v-icon v-bind="activator" role="img" :aria-hidden="false" tabindex="0" size="small" :color="portraitStatuses[storedPortraitId(item)!].owners || portraitStatuses[storedPortraitId(item)!].rewardDefinitions ? 'primary' : 'grey'" :aria-label="usageText(portraitStatuses[storedPortraitId(item)!])">{{ portraitStatuses[storedPortraitId(item)!].owners ? mdiAccountGroupOutline : portraitStatuses[storedPortraitId(item)!].rewardDefinitions ? mdiGiftOutline : mdiMinusCircleOutline }}</v-icon>
                </template>
              </v-tooltip>
            </template>
            <v-tooltip v-else-if="statusError" location="top" text="Portrait usage is unknown because the status check failed. Use Retry status to check again.">
              <template v-slot:activator="{ props: activator }">
                <v-icon v-bind="activator" role="img" :aria-hidden="false" tabindex="0" size="small" color="warning" aria-label="Portrait usage unknown">{{ mdiHelpCircleOutline }}</v-icon>
              </template>
            </v-tooltip>
            <v-tooltip v-else location="top" text="Checking catalogue membership and portrait usage…">
              <template v-slot:activator="{ props: activator }">
                <v-progress-circular v-bind="activator" tabindex="0" indeterminate size="16" width="2" aria-label="Checking portrait status" />
              </template>
            </v-tooltip>
          </div>
          <v-tooltip v-else location="top" text="Usage is only checked for portrait files.">
            <template v-slot:activator="{ props: activator }">
              <span v-bind="activator" tabindex="0" class="text-caption text-medium-emphasis" aria-label="Usage not checked for this file">—</span>
            </template>
          </v-tooltip>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <div class="storage-actions">
            <v-tooltip v-if="storedPortraitId(item) !== null" location="top" text="Manage portrait">
              <template v-slot:activator="{ props: activator }">
                <v-btn v-bind="activator" icon size="small" variant="text" :aria-label="`Manage portrait ${storedPortraitId(item)}`" @click="openPortrait(item)">
                  <v-icon>{{ mdiCog }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip location="top" :text="`Download file from ${providerLabel}`">
              <template v-slot:activator="{ props: activator }">
                <v-btn v-bind="activator" icon size="small" variant="text" :aria-label="`Download ${item.name}`" @click="downloadFile(item)">
                  <v-icon>{{ mdiDownload }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip location="top" max-width="320" :text="storedPortraitId(item) !== null ? 'Choose whether to delete images, player assignments and catalogue/reward references.' : 'Choose whether to delete this file from S3 and Alibaba.'">
              <template v-slot:activator="{ props: activator }">
                <v-btn v-bind="activator" icon size="small" variant="text" :aria-label="`Delete ${item.name}`" @click="deleteFile(item)">
                  <v-icon>{{ mdiDelete }}</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
      <portrait-cleanup-dialog v-model="cleanupOpen" :portraitId="cleanupId" :filename="cleanupFilename" :provider="provider" @cleaned="loadFiles" />
      <portrait-details-dialog v-model="portraitPanelOpen" :portraitId="portraitPanelId" @image-uploaded="loadFiles" />
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
import { mdiDelete, mdiDownload, mdiCamera, mdiMagnify, mdiCog, mdiBookCheckOutline, mdiBookOffOutline, mdiAccountGroupOutline, mdiGiftOutline, mdiMinusCircleOutline, mdiHelpCircleOutline } from "@mdi/js";
import { CloudFile, CloudValidationMessage, CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { DataTableHeader } from "vuetify";
import FileDropZone from "@/components/common/FileDropZone.vue";
import PortraitCleanupDialog from "../portraits/PortraitCleanupDialog.vue";
import PortraitDetailsDialog from "../portraits/PortraitDetailsDialog.vue";
import { compactStorageDate, preciseStorageDate, compactStorageSize, preciseStorageSize, storageFileBytes, storageDateTimestamp } from "@/helpers/storageFileFormatting";
import { PortraitStatusRequests } from "@/helpers/portraitStatusRequests";
import { storedPortraitId } from "@/helpers/storedPortraits";
import AdminService, { type PortraitAssetStatus } from "@/services/admin/AdminService";
import CloudStorageService from "@/services/admin/CloudStorageService";
import type { PropType } from "vue";
import { INGAME_STATIC_RESOURCES_URL } from "@/config/env";

export default defineComponent({
  name: "AdminStorageFiles",
  components: { PortraitDetailsDialog, PortraitCleanupDialog, FileDropZone },
  props: { provider: { type: String as PropType<CloudStorageProvider>, required: true } },
  setup(props) {
    const providerLabel = computed(() => props.provider === CloudStorageProvider.S3 ? "S3" : "Alibaba");
    const oauthStore = useOauthStore();
    const cloudStorageStore = useCloudStorageStore();
    const cleanupOpen = ref(false);
    const cleanupId = ref(0);
    const cleanupFilename = ref("");
    const portraitPanelOpen = ref(false);
    const portraitPanelId = ref(0);
    function openPortrait(file: CloudFile): void {
      const id = storedPortraitId(file);
      if (id === null) return;
      portraitPanelId.value = id;
      portraitPanelOpen.value = true;
    }
    const dialog = ref<boolean>(false);
    const fileToUpload = ref<File | null>(null);
    const isValidationMessageVisible = ref<boolean>(false);
    const tableSearch = ref<string>("");
    const isLoadingFiles = ref<boolean>(true);
    const loadError = ref("");
    const failedPreviews = ref(new Set<string>());
    const isUploadingFile = ref<boolean>(false);

    const files = ref<CloudFile[]>([]);
    const portraitStatuses = ref<Record<number, PortraitAssetStatus>>({});
    const statusError = ref("");
    const visibleFiles = ref<CloudFile[]>([]);
    const statusRequests = new PortraitStatusRequests();
    let statusVersion = 0;
    function usageText(status: PortraitAssetStatus): string {
      if (!status.inCatalogue && !status.owners && !status.rewardDefinitions)
      {return "Unreferenced portrait: no catalogue entry, player assignments or portrait reward references.";}
      return `${status.owners} assigned players · ${status.selectedProfiles} active profile pictures · ${status.rewardDefinitions} portrait reward references`;
    }
    async function loadPortraitStatuses(items: (CloudFile | { raw: CloudFile })[]): Promise<void> {
      visibleFiles.value = items.map((item) => "raw" in item ? item.raw : item);
      const ids = statusRequests.begin(visibleFiles.value.map(storedPortraitId).filter((id): id is number => id !== null && !portraitStatuses.value[id]));
      if (!ids.length) return;
      const request = statusVersion;
      try {
        const statuses = await AdminService.getPortraitAssetStatuses(oauthStore.token, ids);
        if (request === statusVersion) statuses.forEach((status) => { portraitStatuses.value[status.portraitId] = status; });
      } catch (err) {
        if (request === statusVersion) {
          statusRequests.fail(ids);
          statusError.value = err instanceof Error ? err.message : "Try again later.";
        }
      } finally { if (request === statusVersion) statusRequests.complete(ids); }
    }
    function refreshPortraitStatuses(): void {
      ++statusVersion;
      statusRequests.reset();
      portraitStatuses.value = {};
      statusError.value = "";
      loadPortraitStatuses(visibleFiles.value);
    }
    watch(portraitPanelOpen, (open, wasOpen) => { if (wasOpen && !open) refreshPortraitStatuses(); });
    const validationMessage = computed<CloudValidationMessage>(() => cloudStorageStore.validationMessage);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    function previewUrl(file: CloudFile): string | undefined {
      if (!/\.(jpe?g|png|gif|webp|avif|svg|bmp)$/i.test(file.name)) return undefined;
      const path = file.previewPath ?? (/^SPECIAL_\d+\./i.test(file.name) ? `icons/specialAvatars/${file.name}` : undefined);
      if (!path) return undefined;
      const modified = new Date(file.lastModified).getTime();
      return `${INGAME_STATIC_RESOURCES_URL}${path.split("/").map(encodeURIComponent).join("/")}?v=${Number.isFinite(modified) ? modified : 2}`;
    }

    function resetValidationMessage() {
      isValidationMessageVisible.value = false;
      cloudStorageStore.validationMessage = { message: "", isSuccess: true };
    }

    function deleteFile(file: CloudFile): void {
      cleanupId.value = storedPortraitId(file) ?? 0;
      cleanupFilename.value = file.name;
      cleanupOpen.value = true;
    }

    function downloadFile(file: CloudFile): void {
      cloudStorageStore.downloadFile(file.name, props.provider);
    }

    async function uploadFile(): Promise<void> {
      if (!fileToUpload.value) return;
      isUploadingFile.value = true;
      await cloudStorageStore.uploadFile(fileToUpload.value, props.provider);
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
      isLoadingFiles.value = true;
      loadError.value = "";
      failedPreviews.value.clear();
      ++statusVersion;
      statusRequests.reset();
      portraitStatuses.value = {};
      statusError.value = "";
      try {
        files.value = await CloudStorageService.fetchFiles(oauthStore.token, props.provider);
      } catch (err) {
        loadError.value = err instanceof Error ? err.message : `Could not reach the ${providerLabel.value} storage API. Try again later.`;
      } finally {
        isLoadingFiles.value = false;
      }
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      files.value = [];
      resetValidationMessage();
      await loadFiles();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    const headers: DataTableHeader[] = [
      { title: "Preview", sortable: false, value: "preview" },
      { title: "Status", sortable: false, value: "status", width: 76 },
      { title: "Name", sortable: true, value: "name" },
      { title: "Size", sortable: true, value: "size", align: "end", sortRaw: (a: CloudFile, b: CloudFile) => storageFileBytes(a) - storageFileBytes(b) },
      { title: "Last Modified", sortable: true, value: "lastModified" },
      { title: "Actions", sortable: false, value: "actions", align: "end" },
    ];

    return {
      cleanupOpen,
      cleanupId,
      cleanupFilename,
      storageDateTimestamp,
      compactStorageDate,
      preciseStorageDate,
      compactStorageSize,
      preciseStorageSize,
      portraitStatuses,
      statusError,
      loadPortraitStatuses,
      refreshPortraitStatuses,
      usageText,
      mdiBookCheckOutline,
      mdiBookOffOutline,
      mdiAccountGroupOutline,
      mdiGiftOutline,
      mdiMinusCircleOutline,
      mdiHelpCircleOutline,
      providerLabel,
      portraitPanelOpen,
      portraitPanelId,
      openPortrait,
      storedPortraitId,
      mdiCog,
      mdiDelete,
      mdiDownload,
      mdiCamera,
      mdiMagnify,
      headers,
      files,
      tableSearch,
      isLoadingFiles,
      loadError,
      loadFiles,
      previewUrl,
      failedPreviews,
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

<style scoped>
.storage-metadata { white-space: nowrap; font-variant-numeric: tabular-nums; }
.storage-actions { display: flex; gap: 4px; justify-content: flex-end; align-items: center; white-space: nowrap; }
.storage-status { display: flex; gap: 8px; align-items: center; }
.storage-preview {
  display: block;
  object-fit: contain;
  margin: 6px 0;
}
</style>
