<template>
  <v-dialog v-model="dialogOpen" max-width="800">
    <template v-slot:activator="{ props }">
      <v-row class="justify-center ma-0 pa-0">
        <v-btn class="bg-primary text-w3-race-bg" v-bind="props">Add New Portrait</v-btn>
      </v-row>
    </template>

    <v-card>
      <v-container>
        <v-row>
          <v-col>
            <v-card-title class="justify-center">Add New Portrait</v-card-title>
          </v-col>
          <v-btn icon @click="close">
            <v-icon>{{ mdiClose }}</v-icon>
          </v-btn>
        </v-row>

        <v-alert v-if="error" type="error" closable @update:model-value="error = ''">
          {{ error }}
        </v-alert>

        <v-alert v-if="success" type="success" closable @update:model-value="success = ''">
          {{ success }}
        </v-alert>

        <!-- Portrait ID Section -->
        <v-row>
          <v-col cols="9">
            <v-text-field
              v-model="portraitId"
              label="Portrait ID (Auto-calculated)"
              readonly
              variant="underlined"
              color="primary"
              :disabled="uploading"
            />
          </v-col>
          <v-col cols="3">
            <v-btn
              class="bg-primary"
              :disabled="uploading"
              @click="calculateNextPortraitId"
            >
              <v-icon start>{{ mdiRefresh }}</v-icon>
              Refresh
            </v-btn>
          </v-col>
        </v-row>

        <!-- Portrait Groups Section -->
        <v-row>
          <v-col>
            <portrait-group-combobox
              :portraitId="portraitId"
              @groups-changed="updateGroups"
            />
          </v-col>
        </v-row>

        <!-- File Upload Section -->
        <v-row>
          <v-col>
            <v-alert type="info" variant="outlined" density="compact">
              <div class="text-subtitle-2 mb-1">Instructions:</div>
              <ul class="ml-4">
                <li>Select one or multiple JPG files to upload</li>
                <li>Starting ID: {{ portraitId }} (each file gets a unique sequential ID)</li>
                <li>Example: 3 files → SPECIAL_{{ portraitId }}.jpg, SPECIAL_{{ portraitId + 1 }}.jpg, SPECIAL_{{ portraitId + 2 }}.jpg</li>
                <li>Each file creates a portrait definition and uploads to both S3 and Alibaba</li>
              </ul>
            </v-alert>
          </v-col>
        </v-row>

        <v-row>
          <v-col>
            <v-file-input
              v-model="files"
              label="Select JPG files"
              multiple
              accept=".jpg,.jpeg"
              truncate-length="50"
              :disabled="uploading"
              chips
              show-size
              counter
              variant="underlined"
              :prepend-icon="mdiImagePlus"
            />
          </v-col>
        </v-row>

        <!-- Upload Progress -->
        <v-divider v-if="uploadProgress.length > 0" class="my-4" />

        <div v-if="uploadProgress.length > 0">
          <div class="text-h6 mb-3">Upload Progress</div>
          <v-table density="compact">
            <template v-slot:default>
              <thead>
                <tr>
                  <th>Step</th>
                  <th>Status</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(progress, index) in uploadProgress" :key="index">
                  <td>{{ progress.step }}</td>
                  <td>
                    <v-chip :color="getStatusColor(progress.status)" size="small">
                      {{ progress.status }}
                    </v-chip>
                  </td>
                  <td>{{ progress.message }}</td>
                </tr>
              </tbody>
            </template>
          </v-table>
        </div>
      </v-container>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="uploading" @click="close">
          Close
        </v-btn>
        <v-btn
          class="bg-primary text-w3-race-bg"
          :disabled="!canUpload || uploading"
          :loading="uploading"
          @click="startUploadProcess"
        >
          Upload Portrait
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { useCloudStorageStore } from "@/store/admin/cloudStorage/store";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { PortraitDefinition, PortraitDefinitionDTO } from "@/store/admin/types";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import { mdiClose, mdiRefresh, mdiImagePlus } from "@mdi/js";

interface UploadProgress {
  step: string;
  status: "pending" | "uploading" | "success" | "error";
  message?: string;
}

export default defineComponent({
  name: "AddNewPortraitDialog",
  components: {
    PortraitGroupCombobox,
  },
  setup() {
    const playerManagement = usePlayerManagementStore();
    const cloudStorageStore = useCloudStorageStore();

    const dialogOpen = ref<boolean>(false);
    const portraitId = ref<number>(0);
    const groups = ref<string[]>([]);
    const files = ref<File[]>([]);
    const uploading = ref<boolean>(false);
    const uploadProgress = ref<UploadProgress[]>([]);
    const error = ref<string>("");
    const success = ref<string>("");

    const allSpecialPortraits = computed<PortraitDefinition[]>(() => playerManagement.allSpecialPortraits);

    const canUpload = computed(() => {
      return portraitId.value > 0 && files.value && files.value.length > 0;
    });

    function calculateNextPortraitId(): void {
      const existingIds = allSpecialPortraits.value.map((p) => parseInt(p.id, 10));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
      portraitId.value = maxId + 1;
    }

    function updateGroups(newGroups: string[]): void {
      groups.value = newGroups;
    }

    function getStatusColor(status: string): string {
      switch (status) {
        case "success": return "success";
        case "error": return "error";
        case "uploading": return "info";
        default: return "default";
      }
    }

    async function startUploadProcess(): Promise<void> {
      if (!canUpload.value) {
        error.value = "Please select at least one file and ensure Portrait ID is set.";
        return;
      }

      // Validate files are JPG
      const invalidFiles = files.value.filter((f) => !f.name.toLowerCase().match(/\.(jpg|jpeg)$/));
      if (invalidFiles.length > 0) {
        error.value = `Invalid file types. Only JPG files are allowed. Found: ${invalidFiles.map((f) => f.name).join(", ")}`;
        return;
      }

      uploading.value = true;
      error.value = "";
      success.value = "";
      uploadProgress.value = [];

      try {
        // Process each file with its own unique portrait ID
        const currentPortraitId = portraitId.value;

        for (let i = 0; i < files.value.length; i++) {
          const file = files.value[i];
          const filePortraitId = currentPortraitId + i;
          const fileName = `SPECIAL_${filePortraitId}.jpg`;

          // Step 1: Create Portrait Definition for this file
          const definitionStepIndex = uploadProgress.value.length;
          uploadProgress.value.push({
            step: `Create Portrait Definition (ID: ${filePortraitId})`,
            status: "uploading",
            message: "Creating portrait definition...",
          });

          try {
            const portraitDefinition: PortraitDefinitionDTO = {
              ids: [filePortraitId],
              groups: groups.value,
            };

            await playerManagement.addNewPortraitDefinition(portraitDefinition);

            uploadProgress.value[definitionStepIndex].status = "success";
            uploadProgress.value[definitionStepIndex].message = "Portrait definition created successfully";
          } catch (err) {
            uploadProgress.value[definitionStepIndex].status = "error";
            uploadProgress.value[definitionStepIndex].message = err instanceof Error ? err.message : "Creation failed";
            throw new Error(`Portrait definition creation failed for ID ${filePortraitId}: ${err}`);
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
            uploadProgress.value[s3StepIndex].status = "success";
            uploadProgress.value[s3StepIndex].message = "Uploaded successfully";
          } catch (err) {
            uploadProgress.value[s3StepIndex].status = "error";
            uploadProgress.value[s3StepIndex].message = err instanceof Error ? err.message : "Upload failed";
            throw new Error(`S3 upload failed for ${fileName}: ${err}`);
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
            uploadProgress.value[alibabaStepIndex].status = "success";
            uploadProgress.value[alibabaStepIndex].message = "Uploaded successfully";
          } catch (err) {
            uploadProgress.value[alibabaStepIndex].status = "error";
            uploadProgress.value[alibabaStepIndex].message = err instanceof Error ? err.message : "Upload failed";
            throw new Error(`Alibaba upload failed for ${fileName}: ${err}`);
          }
        }

        // Refresh portrait list
        await playerManagement.loadAllSpecialPortraits();

        const portraitIds = Array.from({ length: files.value.length }, (_, i) => currentPortraitId + i).join(", ");
        success.value = `Successfully created ${files.value.length} portrait(s) (IDs: ${portraitIds}) and uploaded to both storage providers!`;

        // Reset form (keep uploadProgress visible for review)
        files.value = [];
        calculateNextPortraitId();

      } catch (err) {
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

    onMounted(async (): Promise<void> => {
      await playerManagement.loadAllSpecialPortraits();
      calculateNextPortraitId();
    });

    return {
      mdiClose,
      mdiRefresh,
      mdiImagePlus,
      dialogOpen,
      portraitId,
      files,
      uploading,
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
