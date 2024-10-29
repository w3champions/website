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
              :to="{ name: EStatisticsRouteName.PLAYER_ACTIVITY }"
            >
              {{ $t("views_statistics.playeractivity") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: EStatisticsRouteName.MMR }"
            >
              {{ $t("views_statistics.mmr") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: EStatisticsRouteName.WINRATES }"
            >
              {{ $t("views_statistics.wrs") }}
            </v-tab>
            <v-tab
              class="profileTab"
              :to="{ name: EStatisticsRouteName.HEROES }"
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
import { computed, defineComponent, onMounted } from "vue";
import { useOauthStore } from "@/store/oauth/store";
import { useOverallStatsStore } from "@/store/overallStats/store";
import { usePlayerStore } from "@/store/player/store";
import { EStatisticsRouteName } from "@/router/types";

export default defineComponent({
  name: "OverallStatisticsView",
  components: {},
  setup() {
    const oauthStore = useOauthStore();
    const overallStatsStore = useOverallStatsStore();
    const playerStore = usePlayerStore();

    const verifiedBtag = computed<string>(() => oauthStore.blizzardVerifiedBtag);

    async function init() {
      const promises = [];
      promises.push(overallStatsStore.loadGamesPerDayStatistics());
      promises.push(overallStatsStore.loadMatchesOnMapsPerSeason());
      promises.push(overallStatsStore.loadPlayersPerDayStatistics());
      promises.push(overallStatsStore.loadGameLengthStatistics());
      promises.push(overallStatsStore.loadPopularGameHours());
      promises.push(overallStatsStore.loadMapAndRaceStatistics());
      promises.push(overallStatsStore.loadMatchupLengthStatistics(1, 1, "all"));
      if (verifiedBtag.value) {
        promises.push(playerStore.loadProfile({
          battleTag: verifiedBtag.value,
          freshLogin: false,
        }));
      }
      await Promise.all(promises);
    }

    onMounted((): void => {
      init();
    });

    return {
      EStatisticsRouteName,
    };
  },
});
</script>
