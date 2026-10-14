<template>
  <v-dialog v-model="open" max-width="700" :persistent="working" scrollable>
    <template v-slot:activator="{ props: activator }">
      <v-btn v-if="showButton" color="primary" variant="flat" v-bind="activator">Upload image</v-btn>
    </template>
    <portrait-dialog-card :title="`Upload image for portrait #${portraitId}`" subtitle="Fill this existing portrait entry using the same ID." :busy="working" :close-label="complete ? 'Close' : 'Cancel'" @close="open = false">
      <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
      <v-alert v-if="warning" type="warning" class="mb-3">{{ warning }}</v-alert>
      <template v-if="!complete">
        <file-drop-zone :model-value="file ? [file] : []" accept=".jpg,.jpeg,.png,.webp,.gif,.apng" label="Drag & drop a portrait image here" :disabled="working" @update:model-value="file = $event[0] ?? null" />
        <portrait-crop-editor v-if="file" :key="file.name + file.lastModified" :file="file" :disabled="working" @prepared="prepare = $event" />
        <p class="text-caption mt-3">Uploads SPECIAL_{{ portraitId }}.jpg. Existing groups and player assignments stay attached to portrait #{{ portraitId }}.</p>
      </template>
      <p v-if="progress" role="status" class="mt-3">{{ progress }}</p>
      <v-alert v-if="complete" type="success">Image uploaded for portrait #{{ portraitId }}.</v-alert>
      <template v-slot:actions>
        <v-btn v-if="!complete" color="primary" variant="flat" :disabled="!prepare || working" :loading="working" @click="submit">Upload image</v-btn>
      </template>
    </portrait-dialog-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import FileDropZone from "@/components/common/FileDropZone.vue";
import PortraitCropEditor from "./PortraitCropEditor.vue";
import PortraitDialogCard from "./PortraitDialogCard.vue";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import { useOauthStore } from "@/store/oauth/store";

const props = defineProps<{ portraitId: number; showButton: boolean }>();
const emit = defineEmits<{ uploaded: [] }>();
const oauth = useOauthStore();
const open = ref(false);
const working = ref(false);
const complete = ref(false);
const error = ref("");
const warning = ref("");
const progress = ref("");
const file = shallowRef<File | null>(null);
const prepare = shallowRef<(() => Promise<File>) | null>(null);
watch(file, () => { prepare.value = null; }, { flush: "sync" });
watch(open, (isOpen) => {
  if (!isOpen) return;
  file.value = null;
  complete.value = false;
  error.value = "";
  warning.value = "";
});

async function submit(): Promise<void> {
  if (!prepare.value || working.value) return;
  working.value = true;
  error.value = "";
  warning.value = "";
  try {
    progress.value = "Checking the existing S3 entry…";
    const name = `SPECIAL_${props.portraitId}.jpg`;
    const existing = await CloudStorageService.fetchFiles(oauth.token, CloudStorageProvider.S3);
    if (existing.some((item) => item.name === name)) throw new Error("An image already exists in S3 for this portrait. Reload the portrait and use Replace portrait to change it.");
    progress.value = "Preparing portrait image…";
    const encoded = await prepare.value();
    const image = new File([encoded], name, { type: encoded.type });
    progress.value = "Uploading image to S3…";
    const result = await CloudStorageService.uploadFile(oauth.token, image, CloudStorageProvider.S3);
    if (!result.isSuccess) throw new Error(result.message);
    progress.value = "Trying Alibaba upload…";
    try {
      const result = await CloudStorageService.uploadFile(oauth.token, image, CloudStorageProvider.ALIBABA);
      if (!result.isSuccess) throw new Error(result.message);
    } catch (err) {
      warning.value = `Alibaba upload failed; the S3 image is ready. ${err instanceof Error ? err.message : "Upload unavailable."}`;
    }
    complete.value = true;
    emit("uploaded");
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not upload portrait image.";
  } finally {
    progress.value = "";
    working.value = false;
  }
}
</script>
