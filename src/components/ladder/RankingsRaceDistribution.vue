<template>
  <div class="custom-table-wrapper elevation-1">
    <table class="custom-table">
      <thead>
        <tr>
          <td>{{ $t("components_ladder_rankingsracedistribution.race") }}</td>
          <td>
            {{
              $t("components_ladder_rankingsracedistribution.numberofplayers")
            }}
          </td>
          <td>
            {{ $t("components_ladder_rankingsracedistribution.percent") }}
          </td>
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
          <td>
            {{ item.total }}
          </td>
          <td>{{ item.percent }}%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { Ranking } from "@/store/ranking/types";
import * as _ from "lodash";
import { ERaceEnum } from "@/store/typings";

@Component({
  components: {
    RaceIcon,
  },
})
export default class RankingsRaceDistribution extends Vue {
  @Prop() rankings!: Ranking[];

  get raceDistributions(): { race: number; total: number; percent: number }[] {
    if (!this.rankings) {
      return [];
    }

    const result: { race: number; total: number; percent: number }[] = [];

    var groupedByRace = _.groupBy(this.rankings, (x) => {
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
          percent: Math.round((element.length / this.rankings.length) * 100),
        };

        result.push(raceDistribution);
      }
    }

    return _.orderBy(result, (x) => x.percent, "desc");
  }

  public getRaceName(race: number) {
    return this.$t(`races.${ERaceEnum[race]}`);
  }
}
</script>

<style></style>
