<template>
  <v-card variant="outlined">
    <v-card-title class="text-subtitle-1 d-flex align-center">
      Event games
      <v-spacer />
      <v-btn variant="text" size="small" :prepend-icon="mdiRefresh" :disabled="store.gamesLoading" @click="store.loadGames(true)">
        Refresh
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-alert v-if="store.gamesError" type="error" variant="tonal" density="compact" class="mb-2">
        {{ store.gamesError }}
      </v-alert>
      <v-alert v-if="store.matchLinkError" type="info" variant="tonal" density="compact" class="mb-2" closable @click:close="store.matchLinkError = ''">
        {{ store.matchLinkError }}
      </v-alert>

      <v-data-table
        :headers="headers"
        :items="store.games"
        :loading="store.gamesLoading"
        :items-per-page="-1"
        :header-props="{ class: ['text-medium-emphasis', 'font-weight-bold'] }"
        item-value="matchId"
        density="compact"
        hide-default-footer
        no-data-text="No event games yet."
      >
        <template v-slot:[`item.startedAt`]="{ item }">
          {{ formatUtc(item.startedAt) }}
        </template>

        <template v-slot:[`item.lobbyName`]="{ item }">
          <div>{{ item.lobbyName }}</div>
          <div class="text-caption text-medium-emphasis">host {{ item.host || "—" }}</div>
        </template>

        <template v-slot:[`item.teams`]="{ item }">
          <div v-for="(line, index) in teamLines(item.teams)" :key="index">{{ line }}</div>
          <div v-if="item.computers > 0" class="text-caption text-medium-emphasis">{{ item.computers }} computer(s)</div>
        </template>

        <template v-slot:[`item.outcome`]="{ item }">
          <v-chip size="small" variant="flat" :color="outcomeColor(item)">{{ outcomeLabel(item) }}</v-chip>
        </template>

        <template v-slot:[`item.lengthSeconds`]="{ item }">
          {{ item.lengthSeconds != null ? formatSecondsToDuration(item.lengthSeconds) : "—" }}
        </template>

        <template v-slot:[`item.watch`]="{ item }">
          <div>{{ item.viewerCount }} viewers</div>
          <div class="text-caption text-medium-emphasis">
            {{ formatWatchTime(item.watchedSecondsTotal) }} total, {{ formatWatchTime(item.watchedSecondsAvg) }} avg
          </div>
        </template>

        <template v-slot:[`item.match`]="{ item }">
          <v-btn
            v-if="item.outcome !== 'in-progress'"
            variant="text"
            size="small"
            :loading="store.resolvingMatchId === item.matchId"
            :disabled="store.resolvingMatchId !== ''"
            @click="openMatch(item.matchId)"
          >
            Match page
          </v-btn>
          <span v-else class="text-caption text-medium-emphasis">running</span>
        </template>
      </v-data-table>

      <div v-if="store.gamesCursor !== null" class="d-flex justify-center mt-2">
        <v-btn variant="text" :loading="store.gamesLoading" @click="store.loadGames(false)">Load more</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { mdiRefresh } from "@mdi/js";
import { useRouter } from "vue-router";
import type { DataTableHeader } from "vuetify";
import { formatSecondsToDuration } from "@/helpers/date-functions";
import { EMainRouteName } from "@/router/types";
import { formatUtc } from "@/store/admin/commercialEvents/dates";
import { useCommercialEventDetailStore } from "@/store/admin/commercialEvents/eventDetailStore";
import { formatWatchTime, outcomeLabel, teamLines } from "@/store/admin/commercialEvents/format";
import type { EventGame } from "@/store/admin/commercialEvents/types";

const store = useCommercialEventDetailStore();
const router = useRouter();

const headers: DataTableHeader[] = [
  { title: "Started (UTC)", value: "startedAt", sortable: false },
  { title: "Lobby", value: "lobbyName", sortable: false },
  { title: "Teams", value: "teams", sortable: false },
  { title: "Outcome", value: "outcome", sortable: false },
  { title: "Length", value: "lengthSeconds", sortable: false },
  { title: "Viewers / watch time", value: "watch", sortable: false },
  { title: "", value: "match", sortable: false },
];

function outcomeColor(game: EventGame): string {
  if (game.outcome === "in-progress") return "info";
  return game.outcome === "valid" ? "success" : "warning";
}

async function openMatch(matchId: string): Promise<void> {
  const id = await store.resolveMatchPage(matchId);
  if (id !== null) await router.push({ name: EMainRouteName.MATCH, params: { matchId: id } });
}
</script>
