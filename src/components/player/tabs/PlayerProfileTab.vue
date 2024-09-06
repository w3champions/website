<template>
  <div>
    <v-card-text v-if="!loadingProfile">
      <v-row class="mt-4 filter-none">
        <v-col cols="12" md="4" lg="3">
          <v-card-text style="padding-top: 0 !important">
            <player-avatar :is-logged-in-player="isLoggedInPlayer" />
          </v-card-text>
        </v-col>
        <v-col md="12" lg="9">
          <v-row v-if="!isBetaSeason">
            <v-col cols="12" md="4" v-for="gameModeStat in topGameModeStats" :key="gameModeStat.gameMode">
              <player-league :modeStat="gameModeStat"></player-league>
            </v-col>
          </v-row>
          <v-row v-if="isBetaSeason">
            <v-col>
              <v-card-text>
                {{ $t("components_player_tabs_playerprofiletab.betaText") }}
              </v-card-text>
            </v-col>
          </v-row>
          <v-row class="filter-none" v-if="!isBetaSeason">
            <v-col cols="12" md="4">
              <h4 style="position: relative">
                {{ $t("components_player_tabs_playerprofiletab.statsByRace") }}
              </h4>
              <v-data-table hide-default-footer :headers="raceHeaders" :items="selectedRaceStats">
                <template v-slot:item.race="{ item }">
                  <span><race-icon v-bind:race="item.race" /></span>
                </template>
                <template v-slot:item.wins="{ item }">
                  <span class="number-text">
                    <span class="won">{{ item.wins }}</span>
                    -
                    <span class="lost">{{ item.losses }}</span>
                    <span style="float: right">({{ (item.winrate * 100).toFixed(1) }}%)</span>
                  </span>
                </template>
              </v-data-table>
            </v-col>
            <v-col cols="12" md="8">
              <h4 style="position: relative">
                {{ $t("components_player_tabs_playerprofiletab.statsByMode") }}
              </h4>
              <mode-stats-grid :stats="gameModeStats" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-if="loadingProfile" style="min-height: 500px" class="text-center">
      <v-progress-circular style="margin-top: 180px" :size="50" color="primary" indeterminate></v-progress-circular>
    </v-card-text>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent } from "vue";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";
import sortBy from "lodash/sortBy";
import take from "lodash/take";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import ModeStatsGrid from "@/components/player/ModeStatsGrid.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { EGameMode } from "@/store/types";
import { useOauthStore } from "@/store/oauth/store";
import { usePlayerStore } from "@/store/player/store";
import { useRootStateStore } from "@/store/rootState/store";
import { ModeStat, RaceStat } from "@/store/player/types";
import { Season } from "@/store/ranking/types";

interface PlayerProfileTabRaceHeader {
  text: TranslateResult;
  sortable: boolean;
  value: string;
}

export default defineComponent({
  name: "PlayerProfileTab",
  components: {
    RaceIcon,
    ModeStatsGrid,
    PlayerAvatar,
    PlayerLeague,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const oauthStore = useOauthStore();
    const playerStore = usePlayerStore();
    const rootStateStore = useRootStateStore();

    const battleTag: ComputedRef<string> = computed((): string => decodeURIComponent(props.id));
    const selectedSeason: ComputedRef<Season> = computed((): Season => playerStore.selectedSeason);
    const isBetaSeason: ComputedRef<boolean> = computed((): boolean => selectedSeason.value?.id === 0);
    const loadingProfile: ComputedRef<boolean> = computed((): boolean => playerStore.loadingProfile);
    const verifiedBtag: ComputedRef<string> = computed((): string => oauthStore.blizzardVerifiedBtag);
    const gameModeStats: ComputedRef<ModeStat[]> = computed((): ModeStat[] => playerStore.gameModeStats);
    const raceStats: ComputedRef<RaceStat[]> = computed((): RaceStat[] => playerStore.raceStats);

    const isLoggedInPlayer: ComputedRef<boolean> = computed((): boolean => {
      if (verifiedBtag.value === "") return false;
      return battleTag.value.startsWith(verifiedBtag.value);
    });

    const selectedRaceStats: ComputedRef<RaceStat[]> = computed((): RaceStat[] => {
      if (!raceStats.value) return [];

      return raceStats.value.filter(
        (r) => r.gateWay === rootStateStore.gateway && r.season === selectedSeason.value?.id
      );
    });

    const topGameModeStats: ComputedRef<ModeStat[]> = computed((): ModeStat[] => {
      if (!gameModeStats.value) return [];

      const oneVOnes = gameModeStats.value.filter((g) => g.gameMode === EGameMode.GM_1ON1);

      const rankedOneVOnes = oneVOnes.filter((x) => x.rank != 0);

      let bestOneVOne = sortBy(rankedOneVOnes, ["leagueOrder", "division", "rank"])[0];

      if (!bestOneVOne) {
        bestOneVOne = oneVOnes[0];
      }

      const twoV2s = gameModeStats.value.filter((g) => g.gameMode === EGameMode.GM_2ON2_AT);
      const rankedtwoV2s = twoV2s.filter((x) => x.rank != 0);

      let besttwoV2s = sortBy(rankedtwoV2s, ["leagueOrder", "division", "rank"])[0];

      if (!besttwoV2s) {
        besttwoV2s = twoV2s[0];
      }

      const otherModes = gameModeStats.value.filter(
        (g) => g.gameMode !== EGameMode.GM_1ON1 && g.gameMode !== EGameMode.GM_2ON2_AT
      );

      const otherModesRanked = otherModes.filter((g) => g.rank != 0);
      const bestOtherModes = sortBy(otherModesRanked, ["leagueOrder", "division", "rank"]);

      const allModes = [];
      if (bestOneVOne) allModes.push(bestOneVOne);
      if (besttwoV2s) allModes.push(besttwoV2s);
      allModes.push(...bestOtherModes);

      const bestAllModesSorted = sortBy(allModes, ["leagueOrder", "division", "rank"]);

      return take(
        bestAllModesSorted.filter((x) => x.rank != 0),
        3
      );
    });

    const raceHeaders: PlayerProfileTabRaceHeader[] = [
      {
        text: t("components_player_tabs_playerprofiletab.race"),
        sortable: false,
        value: "race",
      },
      {
        text: t("components_player_tabs_playerprofiletab.winloss"),
        sortable: false,
        value: "wins",
      },
    ];

    return {
      loadingProfile,
      isLoggedInPlayer,
      isBetaSeason,
      topGameModeStats,
      raceHeaders,
      selectedRaceStats,
      gameModeStats,
    };
  },
});
</script>

<style lang="scss" scoped>
.countryInput {
  margin-left: -11px;
}

.player-country {
  position: absolute;
  border-color: white;
  border-style: solid;
  border-width: thin;
  bottom: 0px;
  right: -5px;
}

.country__container {
  position: relative;
  max-width: 120px;
}

.socialIcon {
  padding-top: 0px;
  padding-left: 2px;
}

.twitchIcon {
  margin-top: 2px;
}

@media (min-width: 960px) {
  .player-avatar {
    height: 185px !important;
  }

  .country__container {
    max-width: 185px !important;
  }
}

.player-avatar {
  max-width: 185px;
  height: 120px;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing {
  padding-top: 100%;
  width: 100%;
  background-repeat: no-repeat;
  background-size: contain;
}

.player-avatar-choosing-disabled {
  opacity: 0.5;
  filter: alpha(opacity=50);
}

.player-league {
  width: 182px;

  .player-league-rank {
    font-size: 20px;
  }

  .player-league-points {
    font-size: 13px;
  }
}
</style>
