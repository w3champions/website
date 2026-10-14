<template>
  <v-dialog v-model="dialogOpen" max-width="850" :persistent="saving" scrollable>
    <template v-slot:activator="{ props: activator }">
      <v-btn color="primary" variant="outlined" v-bind="activator">{{ mode === 'empty' ? 'Create empty slot' : 'Register existing image' }}</v-btn>
    </template>
    <portrait-dialog-card :title="mode === 'empty' ? 'Create empty slot' : 'Register existing image'" :subtitle="mode === 'empty' ? 'Create a portrait entry now and upload its image later.' : 'Add an unregistered S3 image to the portrait catalogue.'" :busy="saving" @close="dialogOpen = false">
      <v-alert v-if="catalogueError" type="error" density="compact" class="mb-4">
        {{ catalogueError }}
        <v-btn variant="outlined" class="ml-3" :loading="catalogueLoading" @click="loadCatalogue">Retry</v-btn>
      </v-alert>
      <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
      <v-alert v-if="loadError" type="error" density="compact">
        {{ loadError }}
        <v-btn variant="outlined" class="ml-3" :loading="loading" @click="loadFiles">Retry</v-btn>
      </v-alert>
      <section v-if="mode === 's3'" class="portrait-form-section">
        <h2 class="portrait-form-title">Choose an image</h2>
        <template v-if="!loadError">
          <v-text-field v-model="search" label="Search by filename or portrait ID" variant="outlined" density="comfortable" :prepend-inner-icon="mdiMagnify" :disabled="saving" hide-details class="mb-3" />
          <v-data-table :headers="headers" :items="availableFiles" :search="search" :items-per-page="5" :items-per-page-options="[5, 10, 25]" :loading="loading" loading-text="Loading S3 portrait images…" :sort-by="[{ key: 'lastModified', order: 'desc' }]" no-data-text="No unregistered portrait images found in S3." no-results-text="No matching portrait images.">
            <template v-slot:item.preview="{ item }">
              <img :src="storedPortraitPreviewUrl(item)" :alt="`Preview of ${item.name}`" width="64" height="64" loading="lazy" decoding="async" class="stored-portrait-preview" />
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn :variant="selectedFile?.name === item.name ? 'flat' : 'outlined'" :color="selectedFile?.name === item.name ? 'primary' : undefined" size="small" :disabled="saving" :aria-pressed="selectedFile?.name === item.name" :aria-label="`Select ${item.name}`" @click="selectedFile = item">{{ selectedFile?.name === item.name ? 'Chosen' : 'Choose' }}</v-btn>
            </template>
          </v-data-table>
          <p class="text-caption text-medium-emphasis mt-3">Only images not in the catalogue are listed. The portrait ID comes from the filename. Choose an image, then click Register image to save.</p>
        </template>
      </section>
      <template v-if="mode === 'empty'">
        <section class="portrait-form-section">
          <h2 class="portrait-form-title">Portrait details</h2>
          <div class="portrait-id-row">
            <v-text-field v-model="manualId" label="Portrait ID" readonly variant="outlined" density="comfortable" hide-details :disabled="saving || loadingId" />
            <v-btn variant="outlined" :disabled="saving || loadingId" :loading="loadingId" @click="refreshId">Refresh ID</v-btn>
          </div>
          <portrait-group-combobox :key="`empty-${portraitId}`" :portraitId="portraitId" :disabled="saving || catalogueLoading" label="Groups (optional)" variant="outlined" density="comfortable" @groups-changed="groups = $event" />
          <p class="text-body-2 text-medium-emphasis mt-3">Creates a catalogue entry with no image. Open the portrait and choose Upload image when ready. Its filename will be <strong>{{ expectedFilename }}</strong>.</p>
        </section>
      </template>
      <section v-if="mode === 's3' && selectedFile" class="portrait-form-section">
        <div class="stored-portrait-selection">
          <v-img :src="storedPortraitPreviewUrl(selectedFile)" :alt="`Selected portrait ${portraitId}`" width="256" height="256" />
          <div>
            <h2 class="portrait-form-title">Portrait #{{ portraitId }}</h2>
            <p class="mb-2">{{ selectedFile.name }}</p>
            <p class="text-caption text-medium-emphasis mb-4">Pending selection. Click Register image to save.</p>
            <h2 class="portrait-form-title">Assigned groups</h2>
            <portrait-group-combobox :key="portraitId" :portraitId="portraitId" :disabled="saving" label="Groups (optional)" variant="outlined" density="comfortable" @groups-changed="groups = $event" />
          </div>
        </div>
      </section>
      <template v-slot:actions>
        <v-btn color="primary" variant="flat" :disabled="!canSubmit || saving" :loading="saving" @click="confirmDialog">{{ mode === 'empty' ? 'Create empty slot' : 'Register image' }}</v-btn>
      </template>
    </portrait-dialog-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import PortraitDialogCard from "./PortraitDialogCard.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { useOauthStore } from "@/store/oauth/store";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { CloudStorageProvider, type CloudFile } from "@/store/admin/cloudStorage/types";
import { nextPortraitId, storedPortraitId, storedPortraitPreviewUrl, unregisteredPortraitFiles } from "@/helpers/storedPortraits";
import { mdiMagnify } from "@mdi/js";

const playerManagement = usePlayerManagementStore();
const oauth = useOauthStore();
const dialogOpen = ref(false);
const props = withDefaults(defineProps<{ mode?: "s3" | "empty" }>(), { mode: "s3" });
const mode = computed(() => props.mode);
const manualId = ref("");
const loadingId = ref(false);
const catalogueLoading = ref(false);
const catalogueError = ref("");
const selectedFile = ref<CloudFile | null>(null);
const files = ref<CloudFile[]>([]);
const search = ref("");
const groups = ref<string[]>([]);
const saving = ref(false);
const loading = ref(false);
const error = ref("");
const loadError = ref("");
const portraitId = computed(() => mode.value === "empty" ? Number(manualId.value) || 0 : selectedFile.value ? storedPortraitId(selectedFile.value)! : 0);
const expectedFilename = computed(() => manualId.value && !manualIdError.value ? `SPECIAL_${portraitId.value}.jpg` : "SPECIAL_<ID>.jpg");
const manualIdError = computed(() => {
  if (!/^[1-9]\d*$/.test(manualId.value) || !Number.isSafeInteger(Number(manualId.value)) || Number(manualId.value) > 2147483647)
  {return "Enter a positive whole number without leading zeros (maximum 2147483647).";}
  if (files.value.some((file) => storedPortraitId(file) === Number(manualId.value))) return "An S3 image already uses this ID. Use Register existing image instead.";
  return playerManagement.allSpecialPortraits.some((portrait) => portrait.id === manualId.value) ? "This portrait ID is already in the catalogue." : "";
});
const canSubmit = computed(() => !loadingId.value && !catalogueLoading.value && !catalogueError.value && (mode.value === "empty"
  ? !!manualId.value && !manualIdError.value && !loading.value && !loadError.value
  : !!selectedFile.value && !loading.value && !loadError.value));
const availableFiles = computed(() => unregisteredPortraitFiles(files.value, playerManagement.allSpecialPortraits));
const headers = [
  { title: "Preview", key: "preview", sortable: false },
  { title: "Filename", key: "name" },
  { title: "", key: "actions", sortable: false },
];
let requestVersion = 0;

async function loadFiles(): Promise<void> {
  const request = ++requestVersion;
  loading.value = true;
  loadError.value = "";
  try {
    const storedFiles = await CloudStorageService.fetchFiles(oauth.token, CloudStorageProvider.S3);
    if (request === requestVersion) files.value = storedFiles;
  } catch (err) {
    if (request === requestVersion) loadError.value = err instanceof Error ? err.message : "Could not load S3 portrait images.";
  } finally {
    if (request === requestVersion) loading.value = false;
  }
}

async function loadCatalogue(): Promise<void> {
  catalogueLoading.value = true;
  catalogueError.value = "";
  try {
    await Promise.all([playerManagement.loadAllSpecialPortraits(), playerManagement.loadPortraitDefinitionGroups()]);
  } catch (err) {
    catalogueError.value = err instanceof Error ? err.message : "Could not load the portrait catalogue.";
  } finally { catalogueLoading.value = false; }
}

async function refreshId(): Promise<void> {
  loadingId.value = true;
  manualId.value = "";
  error.value = "";
  try {
    await Promise.all([loadFiles(), loadCatalogue()]);
    if (!loadError.value && !catalogueError.value) {
      manualId.value = String(nextPortraitId(playerManagement.allSpecialPortraits, files.value));
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not find an unused portrait ID.";
  } finally { loadingId.value = false; }
}

watch(mode, () => { groups.value = []; error.value = ""; });
watch(dialogOpen, (open) => {
  ++requestVersion;
  if (!open) return;
  manualId.value = "";
  selectedFile.value = null;
  search.value = "";
  error.value = "";
  files.value = [];
  if (mode.value === "empty") refreshId();
  else { loadFiles(); loadCatalogue(); }
});
watch(selectedFile, () => { groups.value = []; error.value = ""; });

async function confirmDialog(): Promise<void> {
  if (!canSubmit.value || saving.value) return;
  if (mode.value === "s3" && !availableFiles.value.some((file) => file.name === selectedFile.value?.name)) {
    error.value = "This portrait is already in the catalogue. Select another image.";
    return;
  }
  saving.value = true;
  error.value = "";
  try {
    await playerManagement.addNewPortraitDefinition({ ids: [portraitId.value], groups: groups.value });
    await playerManagement.loadAllSpecialPortraits();
    await playerManagement.loadPortraitDefinitionGroups();
    dialogOpen.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not add portrait.";
  } finally { saving.value = false; }
}
</script>

<style scoped>
.portrait-id-row { display: flex; align-items: center; gap: 12px; max-width: 380px; margin-bottom: 16px; }
.stored-portrait-preview { display: block; object-fit: contain; margin: 8px 0; }
.stored-portrait-selection { display: grid; grid-template-columns: 256px minmax(0, 1fr); gap: 24px; align-items: center; }
@media (max-width: 600px) {
  .stored-portrait-selection { grid-template-columns: minmax(0, 1fr); }
}
</style>
