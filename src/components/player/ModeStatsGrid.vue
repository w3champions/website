<template>
  <v-data-table
    hide-default-footer
    :headers="headers"
    :items="gameModeStatsCombined"
    mobile-breakpoint="400"
  >
    <template v-for="h in headers" v-slot:[`header.${h.value}`]="{ header }">
      <v-tooltip top v-bind:key="h.text">
        <template v-slot:activator="{ on }">
          <span v-on="on">{{ header.text }}</span>
        </template>
        <span style="white-space: pre-line">{{ header.tooltip }}</span>
      </v-tooltip>
    </template>
    <template v-slot:body="{ items }">
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <span>{{ $t("gameModes." + gameModeEnums[item.gameMode]) }}</span>
            <race-icon
              style="display: inline; padding-left: 10px"
              :race="item.race"
            />
          </td>
          <td class="number-text text-start">
            <div class="text-center">
              <span class="won">{{ item.wins }}</span>
              -
              <span class="lost">{{ item.losses }}</span>
            </div>
            <div class="sub-value">{{ (item.winrate * 100).toFixed(1) }}%</div>
          </td>
          <td class="number-text text-end">
            <div class="text-center">
              {{ item.rank !== 0 ? item.mmr : "-" }}
            </div>
            <div v-if="item.rank !== 0" class="sub-value">
              {{ getTopPercent(item) }}
            </div>
          </td>
          <td class="number-text text-center" style="min-width: 100px">
            <level-progress v-if="item.rank !== 0" :rp="item.rankingPoints"></level-progress>
            <div v-else>-</div>
          </td>
        </tr>
      </tbody>
    </template>
  </v-data-table>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from "vue-property-decorator";
import GameModesMixin from "@/mixins/GameModesMixin";
import { EGameMode } from "@/store/types";
import { ModeStat } from "@/store/player/types";
import RaceIcon from "@/components/player/RaceIcon.vue";
import LevelProgress from "@/components/ladder/LevelProgress.vue";
import isEmpty from "lodash/isEmpty";

@Component({
  components: { RaceIcon, LevelProgress },
})
export default class ModeStatsGrid extends Mixins(GameModesMixin) {
  @Prop() public stats!: ModeStat[];

  public gameModeEnums = EGameMode;

  get gameModeStatsCombined(): ModeStat[] {
    const AT_stats = this.stats.filter((g) => this.isAtMode(g.gameMode));

    if (AT_stats.length === 0) return this.sortByName(this.stats);

    // Arrange AT stats in separate arrays for each AT mode.
    const AT_arranged = this.AT_modes.map((AT_mode) => AT_stats.filter((modeStat) => AT_mode == modeStat.gameMode));

    // Filter out AT modes that haven't been played, sort by ranking points and get the stat with the highest rank.
    const topAtStats = AT_arranged
      .filter((modeStats) => !isEmpty(modeStats))
      .map((modeStats) => modeStats.sort((modeStat) => modeStat.rankingPoints))
      .map((modeStats) => modeStats.filter((modeStat, index) => index === 0))
      .flat();

    // Filter out the old AT stats.
    const modifiedStats = this.stats.filter((g) => !this.isAtMode(g.gameMode));

    // Add the new AT stats.
    topAtStats.forEach((modeStat) => {
      modifiedStats.push(modeStat);
    });

    return this.sortByName(modifiedStats);
  }

  private isAtMode(mode: EGameMode): boolean {
    return this.AT_modes.includes(mode);
  }

  private sortByName(mode: ModeStat[]): ModeStat[] {
    return mode.sort((a, b) => EGameMode[a.gameMode] < EGameMode[b.gameMode] ? -1 : 1);
  }

  getTopPercent(modeStat: ModeStat): string {
    if (modeStat.rank <= 0) {
      return "";
    }
    const quantilePerc = modeStat.quantile * 100;
    const topPerc = 100 - quantilePerc;

    if (topPerc > 90) {
      return "";
    }

    return `${this.$t("common.top")} ${Math.max(topPerc, 0.1).toFixed(1)}%`;
  }

  get headers() {
    return [
      {
        text: this.$t("components_player_modestatsgrid.mode"),
        align: "center",
        sortable: false,
        tooltip: this.$t("components_player_modestatsgrid.mode"),
      },
      {
        text: this.$t("components_player_modestatsgrid.winloss"),
        align: "center",
        sortable: false,
        tooltip: this.$t("components_player_modestatsgrid.winloss"),
      },
      {
        text: this.$t("components_player_modestatsgrid.mmr"),
        align: "center",
        sortable: false,
        tooltip: this.$t("components_player_modestatsgrid.mmr"),
      },
      {
        text: this.$t("components_player_modestatsgrid.level"),
        align: "center",
        sortable: false,
        tooltip: this.$t("components_player_modestatsgrid.leveldesc"),
      },
    ];
  }
}
</script>

<style lang="scss" scoped>
.sub-value {
  font-size: 11px;
  border-top: 2px solid #122a42;
  text-align: center;
}

.theme--light {
  .sub-value {
    border-top: 2px solid rgb(205, 205, 205);
  }
}

.tooltip-inner {
  white-space: pre-line;
}
</style>
