<template>
  <section class="portrait-owners" aria-labelledby="portrait-players-heading">
    <div class="portrait-owners__heading">
      <h2 id="portrait-players-heading" class="portrait-owners__title">Assigned players</h2>
      <v-chip size="small" variant="tonal">{{ total }}</v-chip>
    </div>
    <p class="portrait-owners__description">Includes manual and reward grants. Automatic rewards may grant a removed portrait again.</p>
    <v-alert v-if="error" type="error" class="mb-3">
      {{ error }}
      <v-btn variant="text" :disabled="loading || saving" @click="load">Retry</v-btn>
    </v-alert>
    <v-alert v-if="success" type="success" class="mb-3">{{ success }}</v-alert>
    <v-text-field
      v-if="unfilteredTotal > 25"
      v-model="search"
      class="portrait-owners__search"
      label="Search assigned players"
      variant="outlined"
      density="compact"
      hide-details
      :disabled="saving"
      clearable
    />
    <v-data-table
      v-if="!error"
      class="portrait-owners__table"
      density="comfortable"
      :headers="headers"
      :items="owners"
      :loading="loading"
      :items-per-page="25"
      hide-default-footer
      item-value="battleTag"
      no-data-text="No players are assigned this portrait."
    >
      <template v-slot:item.isSelected="{ item }">
        <v-chip v-if="item.isSelected" color="primary" size="small" variant="tonal">Active</v-chip>
        <v-chip v-else color="grey" size="small" variant="tonal">Available</v-chip>
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="portrait-owners__actions">
          <v-tooltip location="top" text="Edit player tooltip">
            <template v-slot:activator="{ props: activator }">
              <v-btn v-bind="activator" :icon="mdiPencil" size="small" variant="text" :disabled="saving || !canAssign" :aria-label="`Edit tooltip for ${item.battleTag}`" @click="editTooltip(item)" />
            </template>
          </v-tooltip>
          <v-tooltip location="top" text="Remove portrait access">
            <template v-slot:activator="{ props: activator }">
              <v-btn v-bind="activator" :icon="mdiDelete" size="small" variant="text" color="error" :disabled="saving" :aria-label="`Remove portrait access for ${item.battleTag}`" @click="removeTarget = item" />
            </template>
          </v-tooltip>
        </div>
      </template>
      <template v-slot:item.tooltip="{ item }"><span class="portrait-owners__tooltip">{{ item.tooltip || '—' }}</span></template>
    </v-data-table>
    <v-pagination v-if="total > 25" v-model="page" :length="Math.ceil(total / 25)" :disabled="saving" class="mt-3" />
    <div v-if="canAssign" class="portrait-assignment">
      <div class="portrait-assignment__fields">
        <player-search
          v-if="!editingPlayer"
          :setAutofocus="false"
          variant="outlined"
          density="comfortable"
          search-label="Player BattleTag"
          @playerFound="selectPlayer"
          @searchCleared="selectedPlayer = ''"
        />
        <v-text-field v-else :model-value="selectedPlayer" label="Player BattleTag" variant="outlined" density="comfortable" hide-details readonly />
        <v-text-field v-model="tooltip" label="Tooltip (optional)" variant="outlined" density="comfortable" hide-details :disabled="saving" />
        <v-btn color="primary" variant="flat" :disabled="!selectedPlayer || saving" :loading="saving" @click="assign">{{ editingPlayer ? 'Save' : 'Assign' }}</v-btn>
      </div>
      <v-btn v-if="editingPlayer" variant="text" size="small" :disabled="saving" @click="cancelEdit">Cancel edit</v-btn>
    </div>
    <v-dialog :model-value="!!removeTarget" max-width="500" :persistent="saving" @update:model-value="removeTarget = null">
      <v-card>
        <v-card-title>Remove portrait access</v-card-title>
        <v-card-text>
          Remove portrait {{ portraitId }} from {{ removeTarget?.battleTag }}?
          <p v-if="removeTarget?.isSelected" class="mt-2">This is their current profile picture. It will switch to a starter portrait.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="removeTarget = null">Cancel</v-btn>
          <v-btn color="error" :loading="saving" :disabled="saving" @click="remove">Remove access</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import AdminService, { type PortraitOwner } from "@/services/admin/AdminService";
import { useOauthStore } from "@/store/oauth/store";
import { mdiPencil, mdiDelete } from "@mdi/js";
import PlayerSearch from "@/components/common/PlayerSearch.vue";

const props = withDefaults(defineProps<{ portraitId: number; canAssign?: boolean }>(), { canAssign: true });
const oauth = useOauthStore();
const owners = ref<PortraitOwner[]>([]);
const total = ref(0);
const unfilteredTotal = ref(0);
const editingPlayer = ref(false);
const page = ref(1);
const search = ref("");
const selectedPlayer = ref("");
const tooltip = ref("");
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const success = ref("");
const removeTarget = ref<PortraitOwner | null>(null);
const headers = [
  { title: "Player", key: "battleTag", sortable: false },
  { title: "Status", key: "isSelected", sortable: false },
  { title: "Tooltip", key: "tooltip", sortable: false },
  { title: "Actions", key: "actions", sortable: false, align: "end" as const, headerProps: { class: "portrait-owners__actions-header" } },
];
let version = 0;
let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function load(): Promise<void> {
  const request = ++version;
  loading.value = true;
  error.value = "";
  try {
    const result = await AdminService.getPortraitOwners(oauth.token, props.portraitId, page.value, search.value || "");
    if (request !== version) return;
    owners.value = result.players;
    total.value = result.total;
    if (!search.value) unfilteredTotal.value = result.total;
  } catch (err) {
    if (request === version) error.value = err instanceof Error ? err.message : "Could not load assigned players.";
  } finally {
    if (request === version) loading.value = false;
  }
}

watch(() => props.portraitId, () => { page.value = 1; load(); }, { immediate: true });
watch(page, load);
watch(search, () => {
  ++version;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { if (page.value !== 1) page.value = 1; else load(); }, 300);
});

async function assign(): Promise<void> {
  saving.value = true;
  error.value = "";
  success.value = "";
  const battleTag = selectedPlayer.value;
  try {
    await AdminService.putPortraits(oauth.token, { battleTags: [battleTag], portraitIds: [props.portraitId], mouseover: tooltip.value });
    success.value = editingPlayer.value ? `Saved tooltip for ${battleTag}.` : `Assigned portrait to ${battleTag}.`;
    cancelEdit();
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Assignment failed.";
  } finally {
    saving.value = false;
  }
}

async function selectPlayer(battleTag: string): Promise<void> {
  selectedPlayer.value = battleTag;
  tooltip.value = "";
  saving.value = true;
  error.value = "";
  try {
    const result = await AdminService.getPortraitOwners(oauth.token, props.portraitId, 1, battleTag);
    if (selectedPlayer.value === battleTag)
    {tooltip.value = result.players.find((owner) => owner.battleTag === battleTag)?.tooltip ?? "";}
  } catch (err) {
    if (selectedPlayer.value === battleTag) {
      selectedPlayer.value = "";
      error.value = err instanceof Error ? err.message : "Could not load the player's tooltip.";
    }
  } finally { saving.value = false; }
}

function editTooltip(owner: PortraitOwner): void {
  editingPlayer.value = true;
  selectedPlayer.value = owner.battleTag;
  tooltip.value = owner.tooltip ?? "";
}

function cancelEdit(): void {
  editingPlayer.value = false;
  selectedPlayer.value = "";
  tooltip.value = "";
}

async function remove(): Promise<void> {
  if (!removeTarget.value) return;
  saving.value = true;
  error.value = "";
  success.value = "";
  const battleTag = removeTarget.value.battleTag;
  try {
    await AdminService.deletePortraits(oauth.token, { battleTags: [battleTag], portraitIds: [props.portraitId] });
    removeTarget.value = null;
    success.value = `Removed portrait access for ${battleTag}.`;
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Could not remove portrait access.";
  } finally {
    saving.value = false;
  }
}

onBeforeUnmount(() => { ++version; clearTimeout(searchTimer); });
</script>

<style scoped>
.portrait-owners__heading {
  display: flex;
  align-items: center;
  gap: 10px;
}
.portrait-owners__title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0;
}
.portrait-owners__description {
  margin: 4px 0 16px;
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.7;
}
.portrait-owners__search {
  max-width: 320px;
  margin-bottom: 16px;
}
.portrait-owners__table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 6px;
  overflow: hidden;
}
.portrait-owners__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}
.portrait-owners__table :deep(th.portrait-owners__actions-header) { padding-inline-end: 28px; }
.portrait-assignment {
  margin-top: 16px;
}
.portrait-assignment__fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) auto;
  align-items: center;
  gap: 16px;
}
.portrait-owners__tooltip {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
@media (max-width: 600px) {
  .portrait-assignment__fields {
    grid-template-columns: minmax(0, 1fr);
  }
  .portrait-owners__search {
    max-width: none;
  }
}
</style>
