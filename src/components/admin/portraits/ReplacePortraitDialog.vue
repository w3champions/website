<template>
  <v-dialog v-model="open" max-width="700" :persistent="working" scrollable>
    <template v-slot:activator="{ props: activator }">
      <v-btn color="primary" variant="outlined" v-bind="activator">{{ optimize ? "Optimize" : "Replace portrait" }}</v-btn>
    </template>
    <portrait-dialog-card :title="`${optimize ? 'Optimize' : 'Replace'} portrait #${portraitId}`" :subtitle="optimize ? 'Re-encode the stored image as WebP and compare before saving.' : 'Upload a new image and update existing owners.'" :busy="working" :close-label="result ? 'Close' : 'Cancel'" @close="open = false">
      <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
      <v-alert v-for="warning in warnings" :key="warning" type="warning" class="mb-3">{{ warning }}</v-alert>
      <p v-if="loading" role="status">Loading affected players…</p>
      <template v-if="preview">
        <v-alert type="info" variant="outlined" class="mb-3">
          <div>Players receiving portrait #{{ targetId }}: <strong>{{ preview.owners }}</strong></div>
          <div>Active profile pictures switching: <strong>{{ preview.selectedProfiles }}</strong></div>
          <div>Reward definitions updating for future grants: <strong>{{ preview.rewardDefinitions }}</strong></div>
          <p class="mt-2 mb-0">{{ removeOldAssignments ? "Old player grants will be removed after the new portrait is assigned." : "Players will keep both portraits." }} You can clean up the old catalogue entry and stored images afterwards.</p>
        </v-alert>
        <p v-if="preview.replacementPortraitId" class="mb-3">
          This portrait already has replacement {{ targetId }}. You can retry to finish updating any remaining players.
        </p>
        <v-checkbox v-if="!result" v-model="removeOldAssignments" label="Remove the old portrait from players after replacing" :disabled="working" hide-details density="compact" class="mb-3" />
        <div v-if="optimize && preparedFile && !result" class="mb-3">
          <p>Original: {{ formatBytes(originalBytes) }} → WebP: {{ formatBytes(preparedFile.size) }}</p>
          <p>{{ sizeDifference }}</p>
          <p class="text-caption">Re-encoding may change image quality. The existing frame and animation are preserved.</p>
          <img v-if="optimizedUrl" :src="optimizedUrl" width="256" height="256" alt="Optimized portrait preview" />
        </div>
        <template v-else-if="!optimize && !preview.replacementPortraitId && !result">
          <file-drop-zone :model-value="file ? [file] : []" accept=".jpg,.jpeg,.png,.webp,.gif,.apng" label="Drag & drop a portrait image here" :disabled="working" @update:model-value="file = $event[0] ?? null" />
          <portrait-crop-editor
            v-if="file && !preparedFile"
            :key="file.name + file.lastModified"
            :file="file"
            :disabled="working"
            @prepared="prepare = $event"
          />
          <p v-if="preparedFile && !result" class="mb-3">Portrait {{ targetId }} is prepared. Retry will continue with this same image and ID.</p>
        </template>
      </template>
      <p v-if="progress" role="status" class="mt-3">{{ progress }}</p>
      <v-alert v-if="result" type="success" class="mt-3">
        Portrait {{ targetId }} is ready. Player updates: {{ result.updatedPlayers }}. Reward updates: {{ result.updatedRewards }}.
      </v-alert>
      <v-btn v-if="result" class="mt-3" color="error" variant="outlined" @click="cleanupOpen = true">Clean up old portrait…</v-btn>
      <template v-slot:actions>
        <v-btn
          v-if="!result"
          color="primary"
          variant="flat"
          :loading="working"
          :disabled="working || loading || !preview || !!result || (!prepare && !preparedFile && !preview.replacementPortraitId)"
          @click="submit"
        >
          {{ preview?.replacementPortraitId ? "Continue replacement" : optimize ? "Save optimized portrait and replace" : preparedFile ? "Continue replacement" : "Upload and replace" }}
        </v-btn>
      </template>
    </portrait-dialog-card>
  </v-dialog>
  <portrait-cleanup-dialog v-model="cleanupOpen" :portraitId="portraitId" retired @cleaned="refreshCatalogue" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import AdminService, { type PortraitReplacementPreview, type PortraitReplacementResult } from "@/services/admin/AdminService";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { useOauthStore } from "@/store/oauth/store";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import FileDropZone from "@/components/common/FileDropZone.vue";
import { nextPortraitId } from "@/helpers/storedPortraits";
import PortraitCropEditor from "./PortraitCropEditor.vue";
import PortraitCleanupDialog from "./PortraitCleanupDialog.vue";
import PortraitDialogCard from "./PortraitDialogCard.vue";

const props = defineProps<{ portraitId: number; optimize?: boolean }>();
const emit = defineEmits<{ replaced: [] }>();
const oauth = useOauthStore();
const players = usePlayerManagementStore();
const open = ref(false);
const working = ref(false);
const removeOldAssignments = ref(true);
const cleanupOpen = ref(false);
const originalBytes = ref(0);
const optimizedUrl = ref("");
function formatBytes(bytes: number): string { return `${(bytes / 1024).toFixed(1)} KiB`; }
const sizeDifference = computed(() => {
  if (!preparedFile.value || !originalBytes.value) return "";
  const saved = originalBytes.value - preparedFile.value.size;
  return saved > 0 ? `${formatBytes(saved)} smaller (${(saved / originalBytes.value * 100).toFixed(1)}% saved).` : `${formatBytes(-saved)} larger. This image will not save storage space.`;
});
onBeforeUnmount(() => { ++loadVersion; if (optimizedUrl.value) URL.revokeObjectURL(optimizedUrl.value); });
async function refreshCatalogue(): Promise<void> {
  await players.loadAllSpecialPortraits();
  await players.loadPortraitDefinitionGroups();
  emit("replaced");
}
const loading = ref(false);
const error = ref("");
const warnings = ref<string[]>([]);
const progress = ref("");
const preview = ref<PortraitReplacementPreview | null>(null);
const result = ref<PortraitReplacementResult | null>(null);
const file = shallowRef<File | null>(null);
const prepare = shallowRef<(() => Promise<File>) | null>(null);
const preparedFile = shallowRef<File | null>(null);
const targetId = ref(0);
let loadVersion = 0;
let s3Uploaded = false;
let alibabaAttempted = false;
let definitionCreated = false;

watch(file, () => { prepare.value = null; }, { flush: "sync" });
watch(open, async (isOpen) => {
  const request = ++loadVersion;
  if (!isOpen || preparedFile.value || result.value) return;
  loading.value = true;
  error.value = "";
  preview.value = null;
  try {
    const [data, storedFiles] = await Promise.all([
      AdminService.previewPortraitReplacement(oauth.token, props.portraitId),
      CloudStorageService.fetchFiles(oauth.token, CloudStorageProvider.S3),
      players.loadAllSpecialPortraits(),
    ]);
    if (request !== loadVersion) return;
    preview.value = data;
    targetId.value = data.replacementPortraitId ?? nextPortraitId(players.allSpecialPortraits, storedFiles);
    if (props.optimize && !data.replacementPortraitId) {
      progress.value = "Reading the current image from S3…";
      const original = await CloudStorageService.readFile(oauth.token, `SPECIAL_${props.portraitId}.jpg`, CloudStorageProvider.S3);
      if (request !== loadVersion) return;
      originalBytes.value = original.size;
      const { optimizePortrait } = await import("@/services/OptimizePortraitService");
      const encoded = await optimizePortrait(original, (message) => { progress.value = message; });
      if (request !== loadVersion) return;
      preparedFile.value = new File([encoded], `SPECIAL_${targetId.value}.jpg`, { type: encoded.type });
      optimizedUrl.value = URL.createObjectURL(preparedFile.value);
    }
  } catch (err) {
    if (request === loadVersion) error.value = err instanceof Error ? err.message : "Could not load replacement details.";
  } finally {
    if (request === loadVersion) {
      loading.value = false;
      progress.value = "";
    }
  }
});

async function submit(): Promise<void> {
  if (!preview.value || working.value) return;
  working.value = true;
  error.value = "";
  try {
    if (!preview.value.replacementPortraitId) {
      if (!preparedFile.value) {
        if (!prepare.value) throw new Error("Select and prepare a replacement picture first.");
        const encoded = await prepare.value();
        preparedFile.value = new File([encoded], `SPECIAL_${targetId.value}.jpg`, { type: encoded.type });
      }
      if (!s3Uploaded) {
        progress.value = "Uploading replacement to S3…";
        const response = await CloudStorageService.uploadFile(oauth.token, preparedFile.value, CloudStorageProvider.S3);
        if (!response.isSuccess) throw new Error(response.message);
        s3Uploaded = true;
      }
      if (!alibabaAttempted) {
        progress.value = "Trying Alibaba upload…";
        try {
          const response = await CloudStorageService.uploadFile(oauth.token, preparedFile.value, CloudStorageProvider.ALIBABA);
          if (!response.isSuccess) throw new Error(response.message);
        } catch (err) {
          warnings.value.push(`Alibaba upload failed; continuing with S3. ${err instanceof Error ? err.message : "Upload unavailable."}`);
        }
        alibabaAttempted = true;
      }
      if (!definitionCreated) {
        progress.value = "Creating replacement portrait…";
        const groups = players.allSpecialPortraits.find((p) => p.id === props.portraitId.toString())?.groups ?? [];
        await players.addNewPortraitDefinition({ ids: [targetId.value], groups });
        definitionCreated = true;
      }
    }
    progress.value = "Granting the new portrait and updating selected profile pictures…";
    result.value = await AdminService.replacePortrait(oauth.token, props.portraitId, targetId.value, removeOldAssignments.value);
    progress.value = "";
    await players.loadAllSpecialPortraits();
    await players.loadPortraitDefinitionGroups();
    emit("replaced");
    cleanupOpen.value = true;
  } catch (err) {
    progress.value = "";
    error.value = err instanceof Error ? err.message : "Replacement failed. Retry to continue.";
  } finally {
    working.value = false;
  }
}
</script>
