<template>
  <v-dialog v-model="dialogOpen" max-width="850" :persistent="uploading" scrollable>
    <template v-slot:activator="{ props }">
      <v-btn color="primary" variant="flat" v-bind="props">Add new portrait</v-btn>
    </template>
    <portrait-dialog-card title="Add portrait" subtitle="Crop and upload a new profile picture." :busy="uploading" :close-label="success ? 'Close' : 'Cancel'" @close="close">
      <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
      <v-alert v-if="success" type="success" density="compact" class="mb-4">{{ success }}</v-alert>
      <section class="portrait-form-section">
        <h2 class="portrait-form-title">Portrait details</h2>
        <div class="portrait-id-row">
          <v-text-field v-model="portraitId" label="Portrait ID" readonly variant="outlined" density="comfortable" hide-details :disabled="uploading" />
          <v-btn variant="outlined" :disabled="uploading || loadingId" :loading="loadingId" @click="calculateNextPortraitId">Refresh ID</v-btn>
        </div>
        <portrait-group-combobox :portraitId="portraitId" :disabled="uploading" label="Groups (optional)" variant="outlined" density="comfortable" @groups-changed="updateGroups" />
      </section>
      <section class="portrait-form-section">
        <h2 class="portrait-form-title">Image</h2>
        <file-drop-zone v-model="files" accept=".jpg,.jpeg,.png,.webp,.gif,.apng" label="Drag & drop a portrait image here" :disabled="uploading" />
        <p class="text-caption text-medium-emphasis mt-2">This image will be uploaded as SPECIAL_{{ portraitId }}.jpg. Leave groups empty for a personal portrait.</p>
        <portrait-crop-editor v-for="(file, index) in files" :key="`${selectionVersion}-${index}`" :file="file" :disabled="uploading" @prepared="portraitPreparers[index] = $event" />
      </section>
      <section v-if="uploadProgress.length" class="portrait-form-section">
        <h2 class="portrait-form-title">Upload progress</h2>
        <v-table density="compact">
          <thead><tr><th>Step</th><th>Status</th><th>Message</th></tr></thead>
          <tbody>
            <tr v-for="(progress, index) in uploadProgress" :key="index">
              <td>{{ progress.step }}</td>
              <td><v-chip :color="getStatusColor(progress.status)" size="small">{{ progress.status }}</v-chip></td>
              <td>{{ progress.message }}</td>
            </tr>
          </tbody>
        </v-table>
      </section>
      <template v-slot:actions>
        <v-btn color="primary" variant="flat" :disabled="!canUpload || uploading" :loading="uploading" @click="startUploadProcess">Upload portrait</v-btn>
      </template>
    </portrait-dialog-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { useCloudStorageStore } from "@/store/admin/cloudStorage/store";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { useOauthStore } from "@/store/oauth/store";
import { nextPortraitId } from "@/helpers/storedPortraits";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import type { PortraitDefinition, PortraitDefinitionDTO } from "@/store/admin/types";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import PortraitCropEditor from "./PortraitCropEditor.vue";
import FileDropZone from "@/components/common/FileDropZone.vue";
import PortraitDialogCard from "./PortraitDialogCard.vue";
import { mdiClose, mdiRefresh, mdiImagePlus } from "@mdi/js";

interface UploadProgress {
  step: string;
  status: "pending" | "uploading" | "success" | "error" | "warning";
  message?: string;
}

export default defineComponent({
  name: "AddNewPortraitDialog",
  components: {
    PortraitGroupCombobox,
    PortraitCropEditor,
    PortraitDialogCard,
    FileDropZone,
  },
  setup() {
    const playerManagement = usePlayerManagementStore();
    const cloudStorageStore = useCloudStorageStore();

    const dialogOpen = ref<boolean>(false);
    const portraitId = ref<number>(0);
    const groups = ref<string[]>([]);
    const files = ref<File[]>([]);
    const portraitPreparers = ref<((() => Promise<File>) | null)[]>([]);
    const selectionVersion = ref(0);
    watch(files, () => {
      portraitPreparers.value = files.value.map(() => null);
      selectionVersion.value++;
    }, { flush: "sync" });
    const uploading = ref<boolean>(false);
    const loadingId = ref(false);
    const oauth = useOauthStore();
    const uploadProgress = ref<UploadProgress[]>([]);
    const error = ref<string>("");
    const success = ref<string>("");

    const allSpecialPortraits = computed<PortraitDefinition[]>(() => playerManagement.allSpecialPortraits);

    const canUpload = computed(() => {
      return !loadingId.value && portraitId.value > 0 && files.value.length === 1 &&
        portraitPreparers.value.length === files.value.length && portraitPreparers.value.every((file) => file !== null);
    });

    async function calculateNextPortraitId(): Promise<void> {
      loadingId.value = true;
      error.value = "";
      try {
        const [storedFiles] = await Promise.all([CloudStorageService.fetchFiles(oauth.token, CloudStorageProvider.S3), playerManagement.loadAllSpecialPortraits()]);
        portraitId.value = nextPortraitId(allSpecialPortraits.value, storedFiles);
      } catch (err) {
        portraitId.value = 0;
        error.value = err instanceof Error ? err.message : "Could not find an unused portrait ID.";
      } finally { loadingId.value = false; }
    }
    watch(dialogOpen, (open) => { if (open) calculateNextPortraitId(); });

    function updateGroups(newGroups: string[]): void {
      groups.value = newGroups;
    }

    function getStatusColor(status: string): string {
      switch (status) {
        case "success": return "success";
        case "error": return "error";
        case "warning": return "warning";
        case "uploading": return "info";
        default: return "default";
      }
    }

    async function startUploadProcess(): Promise<void> {
      if (!canUpload.value) {
        error.value = "Select one image and ensure the portrait ID is set.";
        return;
      }

      uploading.value = true;
      error.value = "";
      success.value = "";
      uploadProgress.value = [];

      try {
        const [storedFiles] = await Promise.all([CloudStorageService.fetchFiles(oauth.token, CloudStorageProvider.S3), playerManagement.loadAllSpecialPortraits()]);
        if (storedFiles.some((file) => file.name === `SPECIAL_${portraitId.value}.jpg`) || allSpecialPortraits.value.some((portrait) => portrait.id === String(portraitId.value)))
        {throw new Error("This portrait ID is already in use. Refresh ID and try again.");}
        // Encode only on submission, before creating any catalogue entries or uploading.
        const uploadFiles = await Promise.all(portraitPreparers.value.map((prepare) => prepare!()));
        // Process each file with its own unique portrait ID
        const currentPortraitId = portraitId.value;

        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles[i];
          const filePortraitId = currentPortraitId + i;
          const fileName = `SPECIAL_${filePortraitId}.jpg`;

          // Step 1: Create Portrait Definition for this file
          const definitionStepIndex = uploadProgress.value.length;
          uploadProgress.value.push({
            step: `Create Portrait (ID: ${filePortraitId})`,
            status: "uploading",
            message: "Creating portrait...",
          });

          try {
            const portraitDefinition: PortraitDefinitionDTO = {
              ids: [filePortraitId],
              groups: groups.value,
            };

            await playerManagement.addNewPortraitDefinition(portraitDefinition);

            uploadProgress.value[definitionStepIndex].status = "success";
            uploadProgress.value[definitionStepIndex].message = "Portrait created successfully";
          } catch (err: unknown) {
            const ex = err instanceof Error ? err : new Error(String(err));
            const errorMessage = ex.message ?? "Creation failed";
            uploadProgress.value[definitionStepIndex].status = "error";
            uploadProgress.value[definitionStepIndex].message = errorMessage;
            throw new Error(`Portrait creation failed for ID ${filePortraitId}: ${errorMessage}`);
          }

          // Create a new File object with the correct name
          const renamedFile = new File([file], fileName, { type: file.type });

          // Step 2: Upload to S3
          const s3StepIndex = uploadProgress.value.length;
          uploadProgress.value.push({
            step: `Upload to S3 (${fileName})`,
            status: "uploading",
            message: "Uploading...",
          });

          try {
            await cloudStorageStore.uploadFile(renamedFile, CloudStorageProvider.S3);
            if (!cloudStorageStore.validationMessage.isSuccess) throw new Error(cloudStorageStore.validationMessage.message);
            uploadProgress.value[s3StepIndex].status = "success";
            uploadProgress.value[s3StepIndex].message = "Uploaded successfully";
          } catch (err: unknown) {
            const ex = err instanceof Error ? err : new Error(String(err));
            const errorMessage = ex.message ?? "Upload failed";
            uploadProgress.value[s3StepIndex].status = "error";
            uploadProgress.value[s3StepIndex].message = errorMessage;
            throw new Error(`S3 upload failed for ${fileName}: ${errorMessage}`);
          }

          // Step 3: Upload to Alibaba
          const alibabaStepIndex = uploadProgress.value.length;
          uploadProgress.value.push({
            step: `Upload to Alibaba (${fileName})`,
            status: "uploading",
            message: "Uploading...",
          });

          try {
            await cloudStorageStore.uploadFile(renamedFile, CloudStorageProvider.ALIBABA);
            if (!cloudStorageStore.validationMessage.isSuccess) throw new Error(cloudStorageStore.validationMessage.message);
            uploadProgress.value[alibabaStepIndex].status = "success";
            uploadProgress.value[alibabaStepIndex].message = "Uploaded successfully";
          } catch (err: unknown) {
            const ex = err instanceof Error ? err : new Error(String(err));
            const errorMessage = ex.message ?? "Upload failed";
            uploadProgress.value[alibabaStepIndex].status = "warning";
            uploadProgress.value[alibabaStepIndex].message = `Alibaba upload failed; continuing with S3. ${errorMessage}`;
          }
        }

        // Refresh portrait list
        await playerManagement.loadAllSpecialPortraits();

        success.value = `Portrait #${currentPortraitId} created. Select it in Manage Portraits to assign it to a player.`;

        // Reset form (keep uploadProgress visible for review)
        files.value = [];
        await calculateNextPortraitId();

      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : "Upload process failed";
      } finally {
        uploading.value = false;
      }
    }

    function close(): void {
      if (!uploading.value) {
        dialogOpen.value = false;
        error.value = "";
        success.value = "";
        uploadProgress.value = [];
      }
    }



    return {
      mdiClose,
      mdiRefresh,
      mdiImagePlus,
      dialogOpen,
      portraitId,
      files,
      portraitPreparers,
      selectionVersion,
      uploading,
      loadingId,
      uploadProgress,
      error,
      success,
      canUpload,
      calculateNextPortraitId,
      updateGroups,
      getStatusColor,
      startUploadProcess,
      close,
    };
  },
});
</script>

<style scoped>
.portrait-id-row { display: flex; align-items: center; gap: 12px; max-width: 380px; margin-bottom: 16px; }
</style>
