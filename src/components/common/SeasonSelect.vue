<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" class="transparent">
        {{ $t("components_common_seasonselect.season") }} {{ selectedSeason.id }}
        <v-icon class="mr-1">mdi-chevron-right</v-icon>
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>{{ $t("components_common_seasonselect.prevseasons") }}</v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-list dense>
          <v-list-item v-for="season in seasons" :key="season.id" @click="selectSeason(season)">
            <v-list-item-content>
              <v-list-item-title>{{ $t("components_common_seasonselect.season") }} {{ season.id }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";
import { Season } from "@/store/ranking/types";
import { useRankingStore } from "@/store/ranking/store";

export default defineComponent({
  name: "SeasonSelect",
  setup: (_, context) => {
    const rankingsStore = useRankingStore();
    const selectedSeason: ComputedRef<Season> = computed((): Season => rankingsStore.selectedSeason);
    const seasons: ComputedRef<Season[]> = computed((): Season[] => rankingsStore.seasons);

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
