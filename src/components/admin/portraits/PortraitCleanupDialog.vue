<template>
  <v-dialog v-model="open" max-width="600" :persistent="working" scrollable>
    <portrait-dialog-card :title="portraitId > 0 ? `Clean up portrait #${portraitId}` : `Delete ${filename}`" :busy="working" :close-label="result ? 'Close' : 'Cancel'" @close="open = false">
      <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
      <v-alert v-for="warning in result?.warnings ?? []" :key="warning" type="warning" class="mb-3">{{ warning }}</v-alert>
      <p v-if="loading" role="status">Checking portrait usage…</p>
      <p v-if="status" class="mb-3">{{ status.owners }} assigned players · {{ status.selectedProfiles }} active profile pictures · {{ status.rewardDefinitions }} reward references.</p>
      <p class="mb-3">Choose what to remove. These actions cannot be undone.</p>
      <v-checkbox v-if="portraitId > 0" v-model="removeAssignments" label="Remove all player assignments" :disabled="working || !!result && !result.warnings.length" hide-details density="compact" />
      <p v-if="portraitId > 0" class="text-caption mb-2">Players using this portrait switch to the default starter picture.</p>
      <v-checkbox v-if="portraitId > 0" v-model="removeDefinition" label="Remove catalogue entry, groups and reward references" :disabled="working || !!result && !result.warnings.length" hide-details density="compact" />
      <p v-if="portraitId > 0 && removeDefinition" class="text-caption mb-2">Rewards with no portraits left are disabled.</p>
      <v-checkbox v-model="deleteS3" label="Delete image from S3" :disabled="working || !!result && !result.warnings.length" hide-details density="compact" />
      <v-checkbox v-model="deleteAlibaba" label="Delete image from Alibaba" :disabled="working || !!result && !result.warnings.length" hide-details density="compact" />
      <v-alert v-if="(deleteS3 || deleteAlibaba) && !removeAssignments && status?.owners" type="warning" variant="outlined" class="mt-3">Player assignments will remain. Deleting their image can leave a missing profile picture.</v-alert>
      <v-alert v-if="(deleteS3 || deleteAlibaba) && !removeDefinition && (status?.inCatalogue || status?.rewardDefinitions)" type="warning" variant="outlined" class="mt-3">Catalogue and reward references will remain. This portrait may still be offered or granted without an image.</v-alert>
      <v-alert v-if="removeAssignments && !removeDefinition && status?.rewardDefinitions" type="warning" variant="outlined" class="mt-3">Reward references remain and may grant this portrait again.</v-alert>
      <v-alert v-if="result" type="success" class="mt-3">{{ portraitId > 0 ? `Cleanup completed. ${result.updatedPlayers} players and ${result.updatedRewards} rewards updated.` : result.warnings.length ? 'File deletion partially completed.' : 'Selected files deleted.' }} {{ result.warnings.length ? 'Some storage files still need deletion; you can retry.' : '' }}</v-alert>
      <template v-slot:actions>
        <v-btn v-if="!result || result.warnings.length" color="error" variant="flat" :loading="working" :disabled="working || loading || (portraitId > 0 && !status) || !(removeAssignments || removeDefinition || deleteS3 || deleteAlibaba)" @click="submit">{{ result ? 'Retry remaining cleanup' : 'Confirm cleanup' }}</v-btn>
      </template>
    </portrait-dialog-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import AdminService, { type PortraitAssetStatus, type PortraitCleanupResult } from "@/services/admin/AdminService";
import { useOauthStore } from "@/store/oauth/store";
import CloudStorageService from "@/services/admin/CloudStorageService";
import { CloudStorageProvider } from "@/store/admin/cloudStorage/types";
import PortraitDialogCard from "./PortraitDialogCard.vue";
const props = defineProps<{ modelValue: boolean; portraitId: number; provider?: string; retired?: boolean; filename?: string }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; cleaned: [] }>();
const open = computed({ get: () => props.modelValue, set: (value) => emit("update:modelValue", value) });
const oauth = useOauthStore();
const working = ref(false);
const loading = ref(false);
const error = ref("");
const status = ref<PortraitAssetStatus | null>(null);
const result = ref<PortraitCleanupResult | null>(null);
const removeAssignments = ref(false);
const removeDefinition = ref(false);
const deleteS3 = ref(false);
const deleteAlibaba = ref(false);
let version = 0;
watch([open, () => props.portraitId], async ([isOpen]) => {
  const request = ++version;
  if (!isOpen) return;
  removeAssignments.value = !!props.retired;
  removeDefinition.value = !!props.retired;
  deleteS3.value = props.provider === "s3";
  deleteAlibaba.value = props.provider === "alibaba";
  result.value = null;
  status.value = null;
  error.value = "";
  loading.value = props.portraitId > 0;
  if (props.portraitId < 1) return;
  try {
    const statuses = await AdminService.getPortraitAssetStatuses(oauth.token, [props.portraitId]);
    if (request === version) status.value = statuses[0];
  } catch (err) { if (request === version) error.value = err instanceof Error ? err.message : "Could not check usage."; }
  finally { if (request === version) loading.value = false; }
});
async function submit(): Promise<void> {
  working.value = true;
  error.value = "";
  try {
    if (props.portraitId < 1) {
      if (!props.filename) throw new Error("Choose a stored file first.");
      const warnings: string[] = [];
      for (const provider of [CloudStorageProvider.S3, CloudStorageProvider.ALIBABA]) {
        if (!(provider === CloudStorageProvider.S3 ? deleteS3.value : deleteAlibaba.value)) continue;
        const response = await CloudStorageService.deleteFile(oauth.token, props.filename, provider);
        if (!response.isSuccess) warnings.push(`${provider.toUpperCase()} deletion failed. ${response.message}`);
        else if (provider === CloudStorageProvider.S3) deleteS3.value = false;
        else deleteAlibaba.value = false;
      }
      result.value = { updatedPlayers: 0, updatedRewards: 0, warnings };
      emit("cleaned");
      return;
    }
    result.value = await AdminService.cleanupPortrait(oauth.token, props.portraitId, {
      removeAssignments: removeAssignments.value, removeDefinition: removeDefinition.value,
      deleteS3: deleteS3.value, deleteAlibaba: deleteAlibaba.value,
    });
    emit("cleaned");
  } catch (err) { error.value = err instanceof Error ? err.message : "Cleanup failed. Retry to finish."; }
  finally { working.value = false; }
}
</script>
