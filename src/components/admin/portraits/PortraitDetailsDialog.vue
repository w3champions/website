<template>
  <v-dialog v-model="editDialogOpen" max-width="850" :persistent="saving" scrollable>
    <v-card class="portrait-editor">
      <header class="portrait-editor__header">
        <div>
          <h2 class="portrait-editor__title">Edit portrait</h2>
          <p class="portrait-editor__subtitle">Portrait #{{ editPortraitId }}</p>
        </div>
        <v-btn icon variant="text" size="small" :disabled="saving" aria-label="Close portrait editor" @click="editDialogOpen = false">
          <v-icon>{{ mdiClose }}</v-icon>
        </v-btn>
      </header>
      <v-divider />
      <v-card-text class="portrait-editor__body">
        <p v-if="loadingCatalogue" role="status" class="mb-4">Loading portrait catalogue…</p>
        <v-alert v-if="!loadingCatalogue && !error && !registered" type="info" variant="outlined" class="mb-4">
          This image is not in the portrait catalogue. Existing player assignments are shown below. Add it to the catalogue to edit groups, tooltips or grant it to more players.
          <v-btn color="primary" variant="flat" class="mt-3" :loading="saving" @click="registerPortrait">Add to catalogue</v-btn>
        </v-alert>
        <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
        <section class="portrait-editor__image" aria-labelledby="portrait-image-heading">
          <v-img :key="portraitUrl" :src="portraitUrl" alt="Current portrait" width="256" height="256" class="portrait-editor__preview" @error="imageUnavailable = true" @load="imageUnavailable = false">
            <template v-slot:error><div class="portrait-editor__empty">Image unavailable<br />Portrait #{{ editPortraitId }}</div></template>
          </v-img>
          <div>
            <h2 id="portrait-image-heading" class="portrait-editor__section-title">Portrait image</h2>
            <p class="portrait-editor__description">{{ !registered ? 'Stored portrait image.' : imageUnavailable ? 'Upload an image for this existing entry, keeping its ID.' : 'Replace this image and update everyone who has it assigned.' }}</p>
            <upload-portrait-image-dialog :key="editPortraitId" :portraitId="editPortraitId" :showButton="imageUnavailable && registered" @uploaded="refreshPortraitImage" />
            <div class="d-flex flex-wrap ga-2">
              <replace-portrait-dialog v-if="!imageUnavailable && registered && !loadingCatalogue" :key="editPortraitId" :portraitId="editPortraitId" @replaced="refreshAfterReplacement" />
              <replace-portrait-dialog v-if="!imageUnavailable && registered && !loadingCatalogue" :key="`optimize-${editPortraitId}`" :portraitId="editPortraitId" optimize @replaced="refreshAfterReplacement" />
            </div>
          </div>
        </section>
        <v-divider v-if="registered && !loadingCatalogue" class="portrait-editor__divider" />
        <section v-if="registered && !loadingCatalogue" aria-labelledby="portrait-groups-heading">
          <h2 id="portrait-groups-heading" class="portrait-editor__section-title">Assigned groups</h2>
          <p class="portrait-editor__description">Organise this portrait for bulk assignment.</p>
          <portrait-group-combobox
            :key="editPortraitId"
            :portraitId="editPortraitId"
            :disabled="saving"
            label="Groups"
            variant="outlined"
            density="comfortable"
            @groups-changed="updateGroupModel"
          />
          <div class="portrait-editor__section-actions">
            <span v-if="groupsSaved" role="status" class="text-caption text-success">Groups saved.</span>
            <v-spacer />
            <v-btn color="primary" variant="flat" :disabled="saving || !groupsChanged" :loading="saving" @click="changeGroups">Save groups</v-btn>
          </div>
        </section>
        <v-divider class="portrait-editor__divider" />
        <portrait-owners :key="`${editPortraitId}-${ownersVersion}`" :portraitId="editPortraitId" :canAssign="registered && !loadingCatalogue && !error" />
      </v-card-text>
      <v-divider />
      <v-card-actions class="portrait-editor__footer">
        <v-tooltip v-if="registered" location="top" max-width="340" text="Removes this portrait’s catalogue entry and group membership. Player assignments, active profile pictures and the stored image are kept.">
          <template v-slot:activator="{ props: activator }">
            <v-btn v-bind="activator" color="error" variant="text" :disabled="saving" @click="confirmDeleteDialogOpen = true">Remove from catalogue</v-btn>
          </template>
        </v-tooltip>
        <v-spacer />
        <v-btn variant="outlined" :disabled="saving" @click="editDialogOpen = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <v-dialog v-model="confirmDeleteDialogOpen" max-width="450" :persistent="saving">
    <v-card>
      <v-card-title>Remove portrait #{{ editPortraitId }}</v-card-title>
      <v-card-text>
        Remove this portrait from the catalogue? Its group membership will be removed. Stored images, player assignments and active profile pictures will remain.
        <v-alert v-if="error" type="error" density="compact" class="mt-3">{{ error }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="confirmDeleteDialogOpen = false">Cancel</v-btn>
        <v-btn color="error" variant="flat" :loading="saving" :disabled="saving" @click="confirmDelete">Remove portrait</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import PortraitGroupCombobox from "./PortraitGroupCombobox.vue";
import ReplacePortraitDialog from "./ReplacePortraitDialog.vue";
import UploadPortraitImageDialog from "./UploadPortraitImageDialog.vue";
import PortraitOwners from "./PortraitOwners.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/types";
import { mdiClose } from "@mdi/js";

const props = defineProps<{ modelValue: boolean; portraitId: number }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; imageUploaded: [] }>();
const editDialogOpen = computed({ get: () => props.modelValue, set: (value) => emit("update:modelValue", value) });
const editPortraitId = computed(() => props.portraitId);
const playerManagement = usePlayerManagementStore();
const confirmDeleteDialogOpen = ref(false);
const groupsModel = ref<string[]>([]);
const ownersVersion = ref(0);
const imageUnavailable = ref(false);
const imageVersion = ref(0);
const saving = ref(false);
const loadingCatalogue = ref(false);
const error = ref("");
const groupsSaved = ref(false);
const registered = computed(() => playerManagement.allSpecialPortraits.some((p) => p.id === String(props.portraitId)));
const portraitUrl = computed(() => {
  const url = getAvatarUrl(EAvatarCategory.SPECIAL, props.portraitId, false);
  return imageVersion.value ? url.replace(/\?v=.*$/, `?v=${imageVersion.value}`) : url;
});
const groupsChanged = computed(() => {
  const original = playerManagement.allSpecialPortraits.find((p) => p.id === String(props.portraitId))?.groups ?? [];
  return JSON.stringify([...original].sort()) !== JSON.stringify([...groupsModel.value].sort());
});
let version = 0;
watch([() => props.modelValue, () => props.portraitId], async ([open]) => {
  const request = ++version;
  if (!open) return;
  loadingCatalogue.value = true;
  imageUnavailable.value = false;
  groupsSaved.value = false;
  error.value = "";
  confirmDeleteDialogOpen.value = false;
  try {
    await Promise.all([playerManagement.loadAllSpecialPortraits(), playerManagement.loadPortraitDefinitionGroups()]);
    if (request === version) groupsModel.value = [...(playerManagement.allSpecialPortraits.find((p) => p.id === String(props.portraitId))?.groups ?? [])];
  } catch (err) {
    if (request === version) error.value = err instanceof Error ? err.message : "Could not load portrait catalogue.";
  } finally { if (request === version) loadingCatalogue.value = false; }
}, { immediate: true });

function refreshAfterReplacement(): void {
  ownersVersion.value++;
  imageVersion.value = Date.now();
  emit("imageUploaded");
}
function refreshPortraitImage(): void {
  imageVersion.value = Date.now();
  imageUnavailable.value = false;
  emit("imageUploaded");
}
function updateGroupModel(groups: string[]): void { groupsModel.value = groups; groupsSaved.value = false; }
async function registerPortrait(): Promise<void> {
  saving.value = true;
  error.value = "";
  try {
    await playerManagement.addNewPortraitDefinition({ ids: [props.portraitId], groups: [] });
    await Promise.all([playerManagement.loadAllSpecialPortraits(), playerManagement.loadPortraitDefinitionGroups()]);
    ownersVersion.value++;
  } catch (err) { error.value = err instanceof Error ? err.message : "Could not add portrait to catalogue."; }
  finally { saving.value = false; }
}
async function changeGroups(): Promise<void> {
  saving.value = true;
  error.value = "";
  groupsSaved.value = false;
  try {
    await playerManagement.updatePortraitDefinition({ ids: [props.portraitId], groups: groupsModel.value });
    await Promise.all([playerManagement.loadAllSpecialPortraits(), playerManagement.loadPortraitDefinitionGroups()]);
    groupsSaved.value = true;
  } catch (err) { error.value = err instanceof Error ? err.message : "Could not save portrait groups."; }
  finally { saving.value = false; }
}
async function confirmDelete(): Promise<void> {
  saving.value = true;
  error.value = "";
  try {
    await playerManagement.removePortraitDefinition({ ids: [props.portraitId] });
    await playerManagement.loadAllSpecialPortraits();
    confirmDeleteDialogOpen.value = false;
    editDialogOpen.value = false;
  } catch (err) { error.value = err instanceof Error ? err.message : "Could not remove portrait from catalogue."; }
  finally { saving.value = false; }
}
</script>

<style scoped>
.portrait-editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px;
}
.portrait-editor__title {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.4;
}
.portrait-editor__subtitle {
  margin: 4px 0 0;
  opacity: 0.65;
  font-size: 13px;
}
.portrait-editor__body {
  padding: 24px;
}
.portrait-editor__image {
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  align-items: center;
  gap: 24px;
}
.portrait-editor__empty { display: grid; place-content: center; height: 100%; text-align: center; font-size: 14px; opacity: 0.7; }
.portrait-editor__preview {
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.portrait-editor__section-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}
.portrait-editor__description {
  margin: 4px 0 16px;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.7;
}
.portrait-editor__divider {
  margin: 24px 0;
}
.portrait-editor__section-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.portrait-editor__footer {
  padding: 16px 24px;
  gap: 12px;
}
@media (max-width: 600px) {
  .portrait-editor__header,
  .portrait-editor__body,
  .portrait-editor__footer {
    padding: 16px;
  }
  .portrait-editor__image {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .portrait-editor__footer {
    flex-wrap: wrap;
  }
}
</style>
