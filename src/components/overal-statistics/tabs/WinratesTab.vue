<template>
  <div>
    <v-row>
      <v-col cols="md-3">
        <v-card-text>
          <v-select
            :items="maps"
            item-text="mapName"
            item-value="mapId"
            @change="setSelectedMap"
            :label="
              $t(`components_overall-statistics_tabs_winratestab.selectmap`)
            "
            outlined
          />
          <v-select
            :items="mmrs"
            item-text="league"
            item-value="mmr"
            @change="setSelectedMMR"
            :label="
              $t(`components_overall-statistics_tabs_winratestab.selectmmr`)
            "
            outlined
          />
          <v-select
            :items="patches"
            item-text="patchVersion"
            item-value="patch"
            v-model="selectedPatch"
            @change="setSelectedPatch"
            :label="
              $t(`components_overall-statistics_tabs_winratestab.selectpatch`)
            "
            outlined
          />
        </v-card-text>
      </v-col>
      <v-col cols="md-9">
        <v-card-text>
          <v-data-table
            hide-default-footer
            :headers="headers"
            :items="raceWinrateWithoutRandom"
            :mobile-breakpoint="400"
          >
            <template v-slot:body="{ items }">
              <tbody>
                <tr v-for="item in items" :key="item.race">
                  <td>{{ $t("races." + raceEnums[item.race]) }}</td>
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[1]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[2]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[3]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                  <player-stats-race-versus-race-on-map-table-cell
                    :stats="item.winLosses[4]"
                    :compareRace="item.race"
                    :winThreshold="0.51"
                    :lossThreshold="0.49"
                  />
                </tr>
              </tbody>
            </template>
          </v-data-table>
        </v-card-text>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import PlayerStatsRaceVersusRaceOnMapTableCell from "@/components/player/PlayerStatsRaceVersusRaceOnMapTableCell.vue";
import {
  Ratio,
  StatsPerMapAndRace,
  StatsPerWinrate,
} from "@/store/overallStats/types";
import { Watch } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";
@Component({
  components: { PlayerStatsRaceVersusRaceOnMapTableCell },
})
export default class WinratesTab extends Vue {
  public raceEnums = ERaceEnum;
  public selectedPatch = "All";
  public selectedMmr = 0;
  public selectedMap = this.$t("common.overall");

  public headers = [
    {
      text: "",
      align: "start",
      sortable: false,
      value: "race",
    },
    {
      text: this.$t("components_overall-statistics_tabs_winratestab.vshu"),
      align: "start",
      sortable: false,
    },
    {
      text: this.$t("components_overall-statistics_tabs_winratestab.vsorc"),
      align: "start",
      sortable: false,
    },
    {
      text: this.$t("components_overall-statistics_tabs_winratestab.vsud"),
      align: "start",
      sortable: false,
    },
    {
      text: this.$t("components_overall-statistics_tabs_winratestab.vsne"),
      align: "start",
      sortable: false,
    },
  ];

  get mmrs() {
    const mmrsSorted = this.statsPerRaceAndMap
      .map((r) => r.mmrRange)
      .sort()
      .reverse();
    const mapped = mmrsSorted.map((m) => ({
      league: this.$t("mmrLeagueRanges.MMR_" + m),
      mmr: m,
    }));
    return mapped;
  }

  get maps() {
    const stats = this.statsPerRaceAndMap[0];
    if (!stats) return [];
    return stats.patchToStatsPerModes[this.selectedPatch].map((r) => {
      return { mapId: r.mapName, mapName: this.$t("mapNames." + r.mapName) };
    });
  }

  get raceWinrateWithoutRandom(): Ratio[] {
    if (
      !this.statsPerRaceAndMap ||
      !this.statsPerRaceAndMap[0] ||
      !this.statsPerRaceAndMap[0].patchToStatsPerModes[this.selectedPatch]
    ) {
      return [];
    }

    const statsPerMapAndRace = this.statsPerRaceAndMap
      .filter((r) => r.mmrRange === this.selectedMmr)[0]
      .patchToStatsPerModes[this.selectedPatch].filter(
        (r) => r.mapName === this.selectedMap
      )[0];
    if (!statsPerMapAndRace) {
      return [];
    }
    return statsPerMapAndRace.ratio.slice(1, 5);
  }

  public setSelectedMap(map: string) {
    this.selectedMap = map;
  }

  @Watch("statsPerRaceAndMap")
  public onStatsPerRaceAndMapChange(
    newVal: StatsPerMapAndRace[],
    oldVal: StatsPerMapAndRace[]
  ) {
    if (oldVal.length == 0 && newVal.length > 0) {
      if (this.selectedPatch == "") {
        this.setSelectedPatch(this.patches[this.patches.length - 1]);
      }
    }
  }

  get statsPerRaceAndMap(): StatsPerWinrate[] {
    return this.$store.direct.state.overallStatistics.statsPerMapAndRace;
  }

  get patches() {
    if (this.statsPerRaceAndMap[0]) {
      let allowedPatches = ["All"];
      var patches = Object.keys(
        this.statsPerRaceAndMap[0].patchToStatsPerModes
      );
      for (let key in patches) {
        var patch = patches[key];
        let matches = this.getNumberOfMatches(
          this.statsPerRaceAndMap[0].patchToStatsPerModes[patch]
        );

        if (matches > 10000) {
          allowedPatches.push(patch);
        }
      }

      return allowedPatches;
    }
    return [];
  }

  public getNumberOfMatches(patchStats: StatsPerMapAndRace[]) {
    var dict: { [key: string]: number } = {};
    var total = 0;

    patchStats[0].ratio.map((r: Ratio) => {
      r.winLosses.map((wL) => {
        var keys = Object.keys(dict);
        if (keys.length == 0) {
          dict[r.race.toString() + wL.race.toString()] = wL.games;
        }
        var found = false;
        for (const k in keys) {
          var charArray = keys[k].split("");
          var k0 = charArray[0] || "0";
          var k1 = charArray[1] || "0";

          if (
            (k0 == r.race.toString() && k1 == wL.race.toString()) ||
            (k1 == r.race.toString() && k0 == wL.race.toString())
          ) {
            found = true;
            break;
          }
        }

        if (!found) {
          dict[r.race.toString() + wL.race.toString()] = wL.games;
          total += wL.games;
        }
      });
    });
    return total;
  }

  public setSelectedMMR(mmr: number) {
    this.selectedMmr = mmr;
  }

  public setSelectedPatch(patch: string) {
    this.selectedPatch = patch;
  }
}
</script>
