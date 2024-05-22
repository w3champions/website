<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <span>{{ $t("views_statistics.w3cstats") }}</span>
          </v-card-title>
          <v-tabs>
            <v-tabs-slider />
            <v-tab
              class="profileTab"
              exact
              :to="{ name: 'OverallStatisticsPlayerActivity' }"
            >
              {{ $t("views_statistics.playeractivity") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsDistribution' }"
            >
              {{ $t("views_statistics.mmr") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsWinrates' }"
            >
              {{ $t("views_statistics.wrs") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: 'OverallStatisticsHeroesWinrates' }"
            >
              {{ $t("views_statistics.heroes") }}
            </v-tab>
          </v-tabs>
          <v-card-text>
            <keep-alive>
              <router-view></router-view>
            </keep-alive>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";

export default defineComponent({
  name: "OverallStatisticsView",
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const overallStatsStore = useOverallStatsStore();
    const playerStore = usePlayerStore();

    const verifiedBtag: ComputedRef<string> = computed((): string => oauthStore.blizzardVerifiedBtag);

    async function init() {
      await overallStatsStore.loadGamesPerDayStatistics();
      await overallStatsStore.loadMapsPerSeason();
      await overallStatsStore.loadPlayersPerDayStatistics();
      await overallStatsStore.loadGameLengthStatistics();
      await overallStatsStore.loadPopularGameHours();
      await overallStatsStore.loadMapAndRaceStatistics();
      await overallStatsStore.loadMatchupLengthStatistics(1, 1, "all");
      if (verifiedBtag.value) {
        await playerStore.loadProfile({
          battleTag: verifiedBtag.value,
          freshLogin: false,
        });
      }
    }

    onMounted((): void => {
      init();
    });

    return {
    };
  },
});
</script>
