<template>
  <div class="custom-table-wrapper elevation-1">
    <table class="custom-table">
      <thead>
        <tr>
          <td>{{ $t("components_ladder_rankingsracedistribution.race") }}</td>
          <td>{{ $t("components_ladder_rankingsracedistribution.numberofplayers") }}</td>
          <td>{{ $t("components_ladder_rankingsracedistribution.percent") }}</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in raceDistributions" :key="item.race">
          <td>
            <race-icon
              style="display: inline; padding-right: 10px"
              :race="item.race"
            />
            <span>{{ getRaceName(item.race) }}</span>
          </td>
          <td>{{ item.total }}</td>
          <td>{{ item.percent }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, PropType } from "vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { Ranking } from "@/store/ranking/types";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { ERaceEnum } from "@/store/types";
import { i18n } from "@/main";
import { TranslateResult } from "vue-i18n";

type RankingsRaceDistributionData = {
  race: number;
  total: number;
  percent: number;
};

export default defineComponent({
  name: "RankingsRaceDistribution",
  components: {
    RaceIcon,
  },
  props: {
    rankings: {
      type: Object as PropType<Ranking[]>,
      required: true,
    },
  },
  setup(props) {
    const raceDistributions: ComputedRef<RankingsRaceDistributionData[]> = computed((): RankingsRaceDistributionData[] => {
      if (!props.rankings) {
        return [];
      }

      const result: RankingsRaceDistributionData[] = [];

      const groupedByRace = groupBy(props.rankings, (x) => {
        return x.race;
      });

      for (const key in groupedByRace) {
        if (Object.prototype.hasOwnProperty.call(groupedByRace, key)) {
          const element = groupedByRace[key];

          const raceDistribution: {
            race: number;
            total: number;
            percent: number;
          } = {
            race: parseInt(key),
            total: element.length,
            percent: Math.round((element.length / props.rankings.length) * 100),
          };

          result.push(raceDistribution);
        }
      }

      return orderBy(result, (x) => x.percent, "desc");
    });

    const getRaceName = (race: number): TranslateResult => i18n.t(`races.${ERaceEnum[race]}`);

    return {
      raceDistributions,
      getRaceName,
    };
  },
});
</script>

<style></style>
