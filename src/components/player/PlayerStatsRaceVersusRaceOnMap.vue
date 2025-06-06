<template>
  <v-tabs v-model="selectedTab" v-if="!isStatsEmpty">
    <v-tabs-slider></v-tabs-slider>
    <v-tab v-for="stat of sortedStats" :key="stat.race" :href="`#tab-${stat.race}`">
      <span v-if="stat.race === ERaceEnum.TOTAL">
        {{ $t("common.allraces") }}
      </span>
      <race-icon v-else :race="stat.race" />
    </v-tab>

    <v-tab-item v-for="stat of sortedStats" :key="stat.race" :value="'tab-' + stat.race">
      <v-card-text>
        <v-row>
          <v-col cols="md-12">
            <race-to-map-stat :stats="stat.winLossesOnMap" />
          </v-col>
        </v-row>
      </v-card-text>
    </v-tab-item>
  </v-tabs>
  <v-card-text v-else>
    {{ $t("components_player_tabs_playerstatistictab.playerhasnomatches") }}
  </v-card-text>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/overall-statistics/RaceToMapStat.vue";
import { ERaceEnum } from "@/store/types";
import RaceIcon from "@/components/player/RaceIcon.vue";
import isEmpty from "lodash/isEmpty";
import { defaultStatsTab } from "@/helpers/profile";

export default defineComponent({
  name: "PlayerStatsRaceVersusRaceOnMap",
  components: {
    RaceToMapStat,
    RaceIcon,
  },
  props: {
    stats: {
      type: Array<RaceWinsOnMap>,
      required: true,
    },
  },
  setup(props) {
    const isStatsEmpty = computed(() => isEmpty(props.stats));

    const selectedTab = computed(() => defaultStatsTab(props.stats));

    // Sort by race, so that the tabs are in the correct order.
    const sortedStats = computed(() => {
      if (!props.stats) return [];
      return [...props.stats].sort((a, b) => a.race - b.race);
    });

    return {
      ERaceEnum,
      selectedTab,
      isStatsEmpty,
      sortedStats,
    };
  },
});
</script>
