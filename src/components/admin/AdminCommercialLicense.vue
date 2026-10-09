<template>
  <div>
    <v-card-title class="pt-3">
      Commercial License
    </v-card-title>
    <v-container v-if="permissionsKnown && !hasPermission" class="w3-container-width">
      <v-alert type="warning" variant="tonal">
        You don't have the CommercialLicense permission.
      </v-alert>
    </v-container>
    <v-container v-else-if="hasPermission" class="w3-container-width">
      <v-alert v-if="store.loadError" type="error" variant="tonal" class="mb-4">
        {{ store.loadError }}
        <template v-slot:append>
          <v-btn variant="text" :disabled="store.loading" @click="store.load()">Retry</v-btn>
        </template>
      </v-alert>
      <v-alert v-if="store.error && !dialog" type="error" variant="tonal" class="mb-4" closable @click:close="store.error = ''">
        {{ store.error }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="store.taggedPlayers"
        :loading="store.loading || store.saving"
        :items-per-page="25"
        :sort-by="[{ key: 'battleTag', order: 'asc' }]"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        no-data-text="No tagged players."
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-btn class="mb-2 bg-primary text-w3-race-bg" :disabled="store.loading || !!store.loadError" @click="openAdd">
              Tag player
            </v-btn>
          </div>
        </template>

        <template v-slot:[`item.battleTag`]="{ item }">
          <router-link :to="getProfileUrl(item.battleTag)">{{ item.battleTag }}</router-link>
        </template>

        <template v-slot:[`item.notify`]="{ item }">
          <v-icon size="small">{{ item.notify ? mdiCheck : mdiClose }}</v-icon>
        </template>

        <template v-slot:[`item.createdAt`]="{ item }">
          {{ formatTimestampStringToDateTime(item.createdAt) }}
        </template>

        <template v-slot:[`item.updatedAt`]="{ item }">
          {{ formatTimestampStringToDateTime(item.updatedAt) }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            title="Edit"
            :aria-label="`Edit ${item.battleTag}`"
            :disabled="store.saving || store.loading"
            @click="openEdit(item)"
          >
            <v-icon size="small">{{ mdiPencil }}</v-icon>
          </v-btn>
          <router-link
            v-if="canUseSmurfChecker"
            :to="smurfCheckerLink(item.battleTag)"
            title="Smurf checker"
            :aria-label="`Smurf checker for ${item.battleTag}`"
          >
            <v-icon size="small">{{ mdiAccountSearch }}</v-icon>
          </router-link>
          <v-btn
            icon
            variant="text"
            size="small"
            title="Remove"
            :aria-label="`Remove ${item.battleTag}`"
            :disabled="store.saving || store.loading"
            @click="removeItem(item)"
          >
            <v-icon size="small">{{ mdiDelete }}</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-container>

    <commercial-license-tag-dialog
      v-if="hasPermission"
      v-model="dialog"
      :tag="editedTag"
      :existing-battle-tags="existingBattleTags"
      :saving="store.saving"
      :error="store.error"
      @save="save"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { mdiAccountSearch, mdiCheck, mdiClose, mdiDelete, mdiPencil } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import CommercialLicenseTagDialog from "@/components/admin/commercial-license/CommercialLicenseTagDialog.vue";
import { useCommercialLicenseStore } from "@/store/admin/commercialLicense/store";
import { toTagRequest } from "@/store/admin/commercialLicense/draft";
import type { CommercialLicenseDraft } from "@/store/admin/commercialLicense/draft";
import type { CommercialLicenseTaggedPlayer } from "@/store/admin/commercialLicense/types";
import { EPermission } from "@/store/admin/permission/types";
import { useOauthStore } from "@/store/oauth/store";
import { EAdminRouteName } from "@/router/types";
import { getProfileUrl } from "@/helpers/url-functions";
import { formatTimestampStringToDateTime } from "@/helpers/date-functions";

const store = useCommercialLicenseStore();
const oauthStore = useOauthStore();

const dialog = ref(false);
const editedTag = ref<CommercialLicenseTaggedPlayer | null>(null);

const hasPermission = computed(() => oauthStore.permissions.includes(EPermission[EPermission.CommercialLicense]));
// Permissions arrive with the profile; empty means not loaded yet (as in AdminNavigation).
const permissionsKnown = computed(() => oauthStore.permissions.length > 0);
const canUseSmurfChecker = computed(() => oauthStore.permissions.includes(EPermission[EPermission.SmurfCheckerQuery]));
const existingBattleTags = computed(() => store.taggedPlayers.map((p) => p.battleTag));

const headers: DataTableHeader[] = [
  { title: "BattleTag", value: "battleTag", sortable: true },
  { title: "Note", value: "note", sortable: false },
  { title: "Notify", value: "notify", sortable: true },
  { title: "Created by", value: "createdBy", sortable: true },
  { title: "Created at", value: "createdAt", sortable: true },
  { title: "Updated by", value: "updatedBy", sortable: true },
  { title: "Updated at", value: "updatedAt", sortable: true },
  { title: "Actions", value: "actions", sortable: false, align: "center" },
];

function smurfCheckerLink(battleTag: string) {
  return { name: EAdminRouteName.SMURF_CHECKER_QUERY, query: { player: battleTag } };
}

function openAdd(): void {
  editedTag.value = null;
  store.error = "";
  dialog.value = true;
}

function openEdit(tag: CommercialLicenseTaggedPlayer): void {
  editedTag.value = tag;
  store.error = "";
  dialog.value = true;
}

async function save(draft: CommercialLicenseDraft): Promise<void> {
  if (await store.upsert(draft.battleTag, toTagRequest(draft))) {
    dialog.value = false;
  }
}

async function removeItem(tag: CommercialLicenseTaggedPlayer): Promise<void> {
  if (confirm(`Remove ${tag.battleTag} from the commercial license list?`)) {
    await store.remove(tag.battleTag);
  }
}

async function init(): Promise<void> {
  if (!hasPermission.value) {
    store.$reset();
    dialog.value = false;
    return;
  }
  await store.load();
}

watch(hasPermission, init);
// A cancelled failed save must not resurface in the page banner.
watch(dialog, (open) => {
  if (!open) store.error = "";
});
onMounted(init);
</script>
