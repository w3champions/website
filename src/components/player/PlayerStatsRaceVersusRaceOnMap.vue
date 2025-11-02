<template>
  <div>
    <v-tabs v-if="!isStatsEmpty" v-model="selectedTab">
      <v-tab v-for="stat of sortedStats" :key="stat.race" :value="`tab-${stat.race}`">
        <span v-if="stat.race === ERaceEnum.TOTAL">
          {{ $t("common.allraces") }}
        </span>
        <race-icon v-else :race="stat.race" />
      </v-tab>
    </v-tabs>
    <v-card-text v-else>
      {{ $t("components_player_tabs_playerstatistictab.playerhasnomatches") }}
    </v-card-text>
    <v-tabs-window v-model="selectedTab">
      <v-tabs-window-item v-for="stat of sortedStats" :key="stat.race" :value="`tab-${stat.race}`">
        <v-card-text>
          <v-row>
            <v-col cols="md-12">
              <race-to-map-stat :stats="stat.winLossesOnMap" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-tabs-window-item>
    </v-tabs-window>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from "vue";
import { RaceWinsOnMap } from "@/store/player/types";
import RaceToMapStat from "@/components/player/RaceToMapStat.vue";
import { ERaceEnum } from "@/store/types";
import RaceIcon from "@/components/player/RaceIcon.vue";
import isEmpty from "lodash/isEmpty";
import { defaultStatsTab } from "@/helpers/profile";
import { usePlayerStore } from "@/store/player/store";

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
    const selectedTab = ref<string>("");
    const playerStore = usePlayerStore();

    watch(() => playerStore.playerStatsRaceVersusRaceOnMap.raceWinsOnMapByPatch?.All, (newData: RaceWinsOnMap[]) => {
      selectedTab.value = defaultStatsTab(newData);
    });

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
