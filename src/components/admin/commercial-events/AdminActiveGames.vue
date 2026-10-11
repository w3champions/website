<template>
  <div>
    <v-card-title class="pt-3">
      Active games
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
      <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4" closable @click:close="store.error = ''">
        {{ store.error }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="store.games"
        :loading="store.loading || store.saving"
        :items-per-page="25"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="matchId"
        no-data-text="No event game is running."
      >
        <template v-slot:top>
          <div class="d-flex align-center px-4">
            <v-spacer />
            <v-btn variant="text" class="mb-2" :prepend-icon="mdiRefresh" :disabled="store.loading || store.saving" @click="store.load()">
              Refresh
            </v-btn>
          </div>
        </template>

        <template v-slot:[`item.eventName`]="{ item }">
          <router-link :to="eventDetailLink(item.eventId)">{{ item.eventName }}</router-link>
          <div class="text-caption text-medium-emphasis">{{ item.eventId }}</div>
        </template>

        <template v-slot:[`item.startedAt`]="{ item }">
          {{ formatUtc(item.startedAt) }}
        </template>

        <template v-slot:[`item.players`]="{ item }">
          {{ item.players.join(", ") }}
        </template>

        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
            variant="text"
            size="small"
            color="error"
            :prepend-icon="mdiStopCircleOutline"
            :disabled="store.saving || store.loading"
            @click="terminate(item)"
          >
            Terminate
          </v-btn>
        </template>
      </v-data-table>
    </v-container>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, watch } from "vue";
import { mdiRefresh, mdiStopCircleOutline } from "@mdi/js";
import type { DataTableHeader } from "vuetify";
import { useCommercialLicensePermission } from "@/composables/useCommercialLicensePermission";
import { useCommercialEventActiveGamesStore } from "@/store/admin/commercialEvents/activeGamesStore";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { eventDetailLink } from "@/store/admin/commercialEvents/links";
import type { ActiveEventGame } from "@/store/admin/commercialEvents/types";

const store = useCommercialEventActiveGamesStore();
const { hasPermission, permissionsKnown } = useCommercialLicensePermission();

const headers: DataTableHeader[] = [
  { title: "Event", value: "eventName", sortable: true },
  { title: "Host", value: "host", sortable: true },
  { title: "Lobby", value: "lobbyName", sortable: false },
  { title: "Started (UTC)", value: "startedAt", sortable: true },
  { title: "Players", value: "players", sortable: false },
  { title: "Live viewers", value: "viewerCount", sortable: true },
  { title: "", value: "actions", sortable: false, align: "end" },
];

async function terminate(game: ActiveEventGame): Promise<void> {
  if (confirm(`Terminate "${game.lobbyName}" (${game.eventName}) now? The game ends for everyone in it and is not counted.`)) {
    await store.terminate(game.matchId);
  }
}

async function init(): Promise<void> {
  if (!hasPermission.value) {
    store.clear();
    return;
  }
  await store.load();
}

watch(hasPermission, init);
onMounted(init);
// Writes still in flight no longer report into this page once it is left.
onBeforeUnmount(() => store.endVisit());
</script>
