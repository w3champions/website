<template>
  <div class="custom-table-wrapper elevation-1">
    <table v-for="countryRank in rankings" :key="countryRank.league" class="custom-table">
      <thead>
        <tr>
          <td
            v-if="leagueMap.get(countryRank.league)"
            colspan="100%"
            class="text-uppercase font-weight-bold"
          >
            <league-icon :league="leagueMap.get(countryRank.league)?.order" />
            <div class="d-inline-block ml-2 my-4">
              {{ leagueMap.get(countryRank.league)?.name }}
              {{
                leagueMap.get(countryRank.league)?.division !== 0
                  ? leagueMap.get(countryRank.league)?.division
                  : null
              }}
            </div>
          </td>
        </tr>
      </thead>
      <thead>
        <tr>
          <td
            v-for="(header, index) in headers"
            :key="index"
            class="header"
            :style="{
              width: header.width,
              'min-width': header.minWidth,
            }"
          >
            {{ header.text }}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in countryRank.ranks"
          :id="`listitem_${item.rankNumber}`"
          :key="item.player.id"
        >
          <td class="number-text">{{ item.rankNumber }}.</td>
          <td>
            <div
              v-for="(playerId, index) in item.player.playerIds"
              :key="playerId.battleTag + '_' + item.race"
              class="d-inline-block rank-icon-container"
              :class="{ 'ml-3': index > 0 }"
            >
              <div v-if="item.playersInfo && (item.playersInfo[index].countryCode || item.playersInfo[index].location) === selectedCountry">
                <div
                  class="player-avatar mr-1 alignRight race-icon"
                  :title="getTitleRace(item, index).toString()"
                  :style="{ 'background-image': `url(${getPlayerIcon(item, index)})` }"
                ></div>

                <player-rank-info :player-id="playerId" />
                <div v-if="isTwitchLive(item)" class="twitch__container">
                  <v-tooltip bottom>
                    <template #:activator="{ on }">
                      <span style="display: inline" class="pointer" v-on="on">
                        <v-btn
                          icon
                          :href="`https:///twitch.tv/${item.playersInfo[index].twitchName}`"
                          target="_blank"
                          v-on="on"
                        >
                          <v-icon
                            v-if="!isCurrentlyLive(item.player.playerIds)"
                            color="purple accent-4"
                          >
                            {{ mdiTwitch }}
                          </v-icon>
                          <v-icon
                            v-if="isCurrentlyLive(item.player.playerIds)"
                            class="blinker"
                            color="red accent-4"
                          >
                            {{ mdiTwitch }}
                          </v-icon>
                        </v-btn>
                      </span>
                    </template>

                    <div v-if="isCurrentlyLive(item.player.playerIds)">
                      {{ $t("components_ladder_rankingsgrid.streamingmatch") }}
                      {{ getLiveOpponent(item.player.playerIds) }}
                    </div>
                    <div v-if="!isCurrentlyLive(item.player.playerIds)">
                      {{ $t("components_ladder_rankingsgrid.streaminglive") }}
                    </div>
                  </v-tooltip>
                </div>
              </div>
              <div v-else class="teammate__container">
                (
                <player-rank-info :player-id="playerId" />
                <div
                  v-if="(item.playersInfo && item.playersInfo[index].countryCode) || item.playersInfo[index].location"
                  class="d-inline-block"
                >
                  <country-flag-extended
                    :countryCode="item.playersInfo[index].countryCode"
                    :location="item.playersInfo[index].location"
                  />
                </div>
                )
              </div>
            </div>
            <span
              v-if="isCurrentlyLive(item.player.playerIds) && !isTwitchLive(item)"
              style="position: relative"
            >
              <v-tooltip bottom>
                <template #:activator="{ on }">
                  <span style="display: inline" class="pointer" v-on="on">
                    <sword-icon class="swords blinker" />
                  </span>
                </template>
                <div>
                  {{ $t("components_ladder_rankingsgrid.nowplayingvs") }}
                  {{ getLiveOpponent(item.player.playerIds) }}
                </div>
              </v-tooltip>
            </span>
          </td>
          <td class="number-text text-end">
            <level-progress :rp="item.rankingPoints" />
          </td>
          <td class="number-text text-end"><race-icon :race="item.race" /></td>
          <td class="number-text text-end">
            {{ item.playersInfo.map((p) => (p.clanId ? p.clanId : "-")).join("/") }}
          </td>
          <td class="number-text text-end won">{{ item.player.wins }}</td>
          <td class="number-text text-end lost">{{ item.player.losses }}</td>
          <td class="number-text text-end">{{ item.player.games }}</td>
          <td class="number-text text-end">{{ (item.player.winrate * 100).toFixed(1) }}%</td>
          <td class="number-text text-end">{{ item.player.mmr }}</td>
        </tr>
      </tbody>
    </table>
    <table v-if="!rankings || rankings.length === 0" class="custom-table">
      <tbody>
        <tr>
          <td colspan="100%" class="text-center">
            {{ $t("components_ladder_countryrankingsgrid.noplayerfound") }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, PropType, ref, toRefs, watch } from "vue";
import flatMap from "lodash/flatMap";
import { Ranking, PlayerId, PlayerInfo, CountryRanking, League } from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum, OngoingMatches } from "@/store/types";
import SwordIcon from "@/components/ladder/SwordIcon.vue";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";
import LevelProgress from "@/components/ladder/LevelProgress.vue";
import { useTwitchStore } from "@/store/twitch/store";
import { useRankingStore } from "@/store/ranking/store";
import { useRootStateStore } from "@/store/rootState/store";
import { mdiTwitch } from "@mdi/js";
import { useI18n } from "vue-i18n-bridge";

export default defineComponent({
  name: "CountryRankingsGrid",
  components: {
    RaceIcon,
    SwordIcon,
    LeagueIcon,
    PlayerRankInfo,
    CountryFlagExtended,
    LevelProgress,
  },
  props: {
    rankings: {
      type: Array<CountryRanking>,
      required: true,
    },
    ongoingMatches: {
      type: Object as PropType<OngoingMatches>,
      required: true,
    },
    selectedCountry: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();
    const twitchStore = useTwitchStore();
    const rankingsStore = useRankingStore();
    const rootStateStore = useRootStateStore();

    const headers = [
      {
        text: t("components_ladder_rankingsgrid.rank"),
        align: "start",
        sortable: false,
        width: "25px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.rankNumber - a.rankNumber;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.player"),
        align: "start",
        sortable: false,
        minWidth: "170px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return ("" + b.player.name).localeCompare(a.player.name);
        },
      },
      {
        text: t("components_ladder_rankingsgrid.level"),
        align: "end",
        sortable: false,
        width: "100px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.rankingPoints - a.rankingPoints;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.race"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.race - a.race;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.clan"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return ("" + b.playersInfo[0].clanId).localeCompare(
            a.playersInfo[0].clanId
          );
        },
      },
      {
        text: t("components_ladder_rankingsgrid.wins"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.wins - a.player.wins;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.losses"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.losses - a.player.losses;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.total"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.games - a.player.games;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.winrate"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.winrate - a.player.winrate;
        },
      },
      {
        text: t("components_ladder_rankingsgrid.mmr"),
        align: "end",
        sortable: false,
        width: "25px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.mmr - a.player.mmr;
        },
      },
    ];

    const leagueMap = ref<Map<number, League>>(new Map());

    onMounted(() => {
      initLeagueMap();
    });

    const rankingsRef = toRefs(props).rankings;
    watch(rankingsRef, onRankingsChanged);

    function onRankingsChanged(newVal: CountryRanking[], oldVal: CountryRanking[]): void {
      if (!newVal) {
        return;
      }

      let triggerTwitchLookup = false;
      if (newVal.length != oldVal.length) {
        triggerTwitchLookup = true;
      }

      if (triggerTwitchLookup) {
        getStreamStatus();
      }

      initLeagueMap();
    }

    async function getStreamStatus(): Promise<void> {
      const twitchNames = flatMap(props.rankings, (cr) => cr.ranks).map(
        (r) => r.playersInfo[0].twitchName
      );

      if (twitchNames.length > 0) {
        await twitchStore.getStreamStatus(twitchNames);
      }
    }

    function initLeagueMap() {
      const league = rankingsStore.ladders?.filter(
        (l) =>
          l.gateway === rootStateStore.gateway &&
          l.gameMode === rankingsStore.gameMode &&
          l.season === rankingsStore.selectedSeason.id
      )[0];
      leagueMap.value = new Map(league?.leagues.map((l) => [l.id, l]));
    }

    function getPlayerIcon(ranking: Ranking, playerIndex: number): string {
      const playersInfo = ranking.playersInfo;
      if (!playersInfo) return getRaceIcon(ERaceEnum.RANDOM);
      const playerInfo = playersInfo[playerIndex];
      if (hasSelectedIcon(playerInfo)) {
        return getAvatarUrl(
          playerInfo.selectedRace,
          playerInfo.pictureId,
          playerInfo.isClassicPicture
        );
      } else {
        return getRaceIcon(playerInfo.calculatedRace);
      }
    }

    function getTitleRace(ranking: Ranking, playerIndex: number): TranslateResult {
      const playersInfo = ranking.playersInfo;
      if (!playersInfo) return t("races.RANDOM");
      const playerInfo = playersInfo[playerIndex];
      if (hasSelectedIcon(playerInfo) && playerInfo.selectedRace <= ERaceEnum.UNDEAD) {
        return t(`races.${ERaceEnum[playerInfo.selectedRace]}`);
      } else {
        return t(`races.${ERaceEnum[playerInfo.calculatedRace]}`);
      }
    }

    function hasSelectedIcon(playerInfo: PlayerInfo) {
      if (
        playerInfo.selectedRace !== undefined &&
        playerInfo.selectedRace != null &&
        playerInfo.pictureId !== undefined &&
        playerInfo.pictureId != null
      ) {
        return playerInfo.selectedRace !== EAvatarCategory.TOTAL;
      }
      return false;
    }

    function getRaceIcon(race: ERaceEnum) {
      return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
    }

    function isTwitchLive(ranking: Ranking): boolean {
      const twitchName = ranking.playersInfo[0].twitchName;
      const streamData = twitchStore.twitchStreamResponse.data;
      if (twitchName && streamData) {
        for (let i = 0; i < streamData.length; i++) {
          const stream = streamData[i];
          if (stream && stream.user_name.toLowerCase() == twitchName.toLowerCase()) {
            return true;
          }
        }
      }
      return false;
    }

    function isCurrentlyLive(playerIds: PlayerId[]): boolean {
      if (!props.ongoingMatches) {
        return false;
      }

      const firstPlayer = playerIds[0].battleTag;
      const foundByFirstPlayer = props.ongoingMatches[firstPlayer] as {
        players: string[];
      };

      if (foundByFirstPlayer) {
        let allMatch = true;
        playerIds.forEach((p) => {
          allMatch = allMatch && foundByFirstPlayer.players.includes(p.battleTag);
        });

        return allMatch;
      }

      return false;
    }

    function getLiveOpponent(playerIds: PlayerId[]): boolean | string {
      if (!props.ongoingMatches) {
        return false;
      }

      const firstPlayer = playerIds[0].battleTag;
      const foundByFirstPlayer = props.ongoingMatches[firstPlayer] as {
        players: string[];
        opponents: string[];
      };
      if (foundByFirstPlayer) {
        return foundByFirstPlayer.opponents.join(",");
      }

      return "";
    }

    return {
      mdiTwitch,
      leagueMap,
      headers,
      getTitleRace,
      getPlayerIcon,
      isTwitchLive,
      isCurrentlyLive,
      getLiveOpponent,
    };
  },
});

</script>

<style lang="scss" scoped>
.red {
  left: 10px;
}

@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0 !important;
  }
}

td.header {
  position: relative;
}

.teammate__container {
  font-size: small;
}

.twitch__container {
  position: relative;
  display: inline-block;
  left: 8px;
}

.twitch-icon {
  position: absolute;
  top: -5px;
  left: 10px;
}

.swords {
  position: absolute;
  top: 0;
  left: 18px;
  cursor: pointer;
}

.race-icon {
  padding: 0;
}
</style>
