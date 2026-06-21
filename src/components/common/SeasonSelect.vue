<template>
  <v-menu location="bottom end">
    <template v-slot:activator="{ props }">
      <v-btn tile class="w3-dropdown-button" style="background-color: transparent" v-bind="props">
        {{ $t("components_common_seasonselect.season") }} {{ selectedSeason.id }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text class="dropdown-menu-content">
        <div class="dropdown-menu-title">{{ $t("components_common_seasonselect.prevseasons") }}</div>
        <v-divider />
        <v-list density="compact" max-height="400" class="overflow-y-auto">
          <v-list-item v-for="season in seasons" :key="season.id" @click="selectSeason(season)">
            <v-list-item-title>{{ $t("components_common_seasonselect.season") }} {{ season.id }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Season } from "@/store/ranking/types";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";

const emit = defineEmits<{
  seasonSelected: [season: Season];
}>();

const rankingsStore = useRankingStore();
const matchStore = useMatchStore();
const selectedSeason = computed<Season>(() => matchStore.selectedSeason);
const seasons = computed<Season[]>(() => rankingsStore.seasons);

function selectSeason(season: Season): void {
  emit("seasonSelected", season);
}
</script>
