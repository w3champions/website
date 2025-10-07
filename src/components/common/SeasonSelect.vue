<template>
  <v-menu offset-x>
    <template v-slot:activator="{ props }">
      <v-btn tile class="bg-transparent text-title" v-bind="props">
        {{ $t("components_common_seasonselect.season") }} {{ selectedSeason.id }}
        <v-icon class="mr-1">mdi-chevron-right</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-title>{{ $t("components_common_seasonselect.prevseasons") }}</v-list-item-title>
        </v-list>
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item v-for="season in seasons" :key="season.id" @click="selectSeason(season)">
            <v-list-item-title>{{ $t("components_common_seasonselect.season") }} {{ season.id }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { Season } from "@/store/ranking/types";
import { useRankingStore } from "@/store/ranking/store";
import { useMatchStore } from "@/store/match/store";

export default defineComponent({
  name: "SeasonSelect",
  setup: (_, context) => {
    const rankingsStore = useRankingStore();
    const matchStore = useMatchStore();
    const selectedSeason = computed<Season>(() => matchStore.selectedSeason);
    const seasons = computed<Season[]>(() => rankingsStore.seasons);

    function selectSeason(season: Season): void {
      context.emit("seasonSelected", season);
    }

    return {
      selectedSeason,
      seasons,
      selectSeason,
    };
  },
});
</script>

<style></style>
