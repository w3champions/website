<template>
  <div class="custom-table-wrapper elevation-1">
    <table
      class="custom-table"
      v-for="countryRank in rankings"
      :key="countryRank.league"
    >
      <thead>
        <tr>
          <td
            colspan="100%"
            class="text-uppercase font-weight-bold"
            v-if="leagueMap.get(countryRank.league)"
          >
            <league-icon :league="leagueMap.get(countryRank.league).order" />
            <div class="d-inline-block ml-2 my-4">
              {{ leagueMap.get(countryRank.league).name }}
              {{
                leagueMap.get(countryRank.league).division !== 0
                  ? leagueMap.get(countryRank.league).division
                  : null
              }}
            </div>
          </td>
        </tr>
      </thead>
      <thead>
        <tr>
          <td
            class="header"
            v-for="header in headers"
            :key="header.text"
            v-bind:style="{
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
          :id="`listitem_${item.rankNumber}`"
          v-for="item in countryRank.ranks"
          :key="item.player.id"
        >
          <td class="number-text">{{ item.rankNumber }}.</td>
          <td>
            <div
              class="d-inline-block rank-icon-container"
              v-bind:class="{ 'ml-3': index > 0 }"
              v-for="(playerId, index) in item.player.playerIds"
              :key="playerId.battleTag + '_' + item.race"
            >
              <div
                v-if="
                  item.playersInfo &&
                  (item.playersInfo[index].countryCode ||
                    item.playersInfo[index].location) === selectedCountry
                "
              >
                <div
                  class="player-avatar mr-1 alignRight race-icon"
                  :title="getTitleRace(item, index)"
                  :style="{
                    'background-image': 'url(' + getRaceIcon(item, index) + ')',
                  }"
                />

                <player-rank-info
                  :player-id="playerId"
                  :clan-id="item.playersInfo[index].clanId"
                  :player-race="item.race"
                />
                <div class="twitch__container" v-if="isTwitchLive(item)">
                  <v-tooltip bottom>
                    <template v-slot:activator="{ on }">
                      <span style="display: inline" class="pointer" v-on="on">
                        <v-btn
                          icon
                          v-on="on"
                          :href="
                            'http://twitch.tv/' +
                            item.playersInfo[index].twitchName
                          "
                          target="_blank"
                        >
                          <v-icon
                            v-if="!isCurrentlyLive(item.player.playerIds)"
                            color="purple accent-4"
                          >
                            mdi-twitch
                          </v-icon>
                          <v-icon
                            v-if="isCurrentlyLive(item.player.playerIds)"
                            class="blinker"
                            color="red accent-4"
                          >
                            mdi-twitch
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
                <player-rank-info
                  :player-id="playerId"
                  :clan-id="item.playersInfo[index].clanId"
                  :player-race="item.race"
                />
                <div
                  class="country-flag__container"
                  v-if="
                    (item.playersInfo && item.playersInfo[index].countryCode) ||
                    item.playersInfo[index].location
                  "
                >
                  <country-flag-extended
                    class="country-flag"
                    :countryCode="item.playersInfo[index].countryCode"
                    :location="item.playersInfo[index].location"
                    size="small"
                  />
                </div>
                )
              </div>
            </div>
            <span
              style="position: relative"
              v-if="
                isCurrentlyLive(item.player.playerIds) && !isTwitchLive(item)
              "
            >
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
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
          <td class="number-text text-end"><race-icon :race="item.race" /></td>
          <td class="number-text text-end">
            {{
              item.playersInfo.map((p) => (p.clanId ? p.clanId : "-")).join("/")
            }}
          </td>
          <td class="number-text text-end won">{{ item.player.wins }}</td>
          <td class="number-text text-end lost">{{ item.player.losses }}</td>
          <td class="number-text text-end">{{ item.player.games }}</td>
          <td class="number-text text-end">
            {{ (item.player.winrate * 100).toFixed(1) }}%
          </td>
          <td class="number-text text-end">{{ item.player.mmr }}</td>
          <td class="number-text text-end">{{ item.rankingPoints }}</td>
        </tr>
      </tbody>
    </table>
    <table
      class="custom-table"
      v-if="!this.rankings || this.rankings.length === 0"
    >
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
import Vue from "vue";
import * as _ from "lodash";
import { Component, Prop, Watch } from "vue-property-decorator";
import {
  Ranking,
  PlayerId,
  PlayerInfo,
  CountryRanking,
  League,
} from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum, OngoingMatches } from "@/store/typings";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import SwordIcon from "@/components/ladder/SwordIcon.vue";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";

@Component({
  components: {
    RaceIcon,
    PlayerIcon,
    SwordIcon,
    LeagueIcon,
    PlayerRankInfo,
    CountryFlagExtended,
  },
})
export default class CountryRankingsGrid extends Vue {
  @Prop() rankings!: CountryRanking[];
  @Prop() ongoingMatches!: OngoingMatches;
  @Prop() selectedCountry!: string;

  get headers() {
    return [
    {
      text: this.$t("components_ladder_rankingsgrid.rank"),
      align: "start",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.rankNumber - a.rankNumber;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.player"),
      align: "start",
      sortable: false,
      minWidth: "170px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return ("" + b.player.name).localeCompare(a.player.name);
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.race"),
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.race - a.race;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.clan"),
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
      text: this.$t("components_ladder_rankingsgrid.wins"),
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.player.wins - a.player.wins;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.losses"),
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.player.losses - a.player.losses;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.total"),
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.player.games - a.player.games;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.winrate"),
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.player.winrate - a.player.winrate;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.mmr"),
      align: "end",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.player.mmr - a.player.mmr;
      },
    },
    {
      text: this.$t("components_ladder_rankingsgrid.rp"),
      align: "end",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking): number => {
        return b.rankingPoints - a.rankingPoints;
      },
    },
  ];
  }

  leagueMap: Map<number, League> = new Map();

  get groupedRankings() {
    return this.rankings;
  }

  mounted() {
    this.initLeagueMap();
  }

  @Watch("rankings")
  public onRankingsChanged(
    newVal: CountryRanking[],
    oldVal: CountryRanking[]
  ): void {
    if (!newVal) {
      return;
    }

    let triggerTwitchLookup = false;
    if (newVal.length != oldVal.length) {
      triggerTwitchLookup = true;
    }

    if (triggerTwitchLookup) {
      this.getStreamStatus();
    }

    this.initLeagueMap();
  }

  async getStreamStatus(): Promise<void> {
    let twitchNames = _.flatMap(this.rankings, (cr) => cr.ranks).map(
      (r) => r.playersInfo[0].twitchName
    );

    if (twitchNames.length > 0) {
      await this.$store.direct.dispatch.twitch.getStreamStatus(twitchNames);
    }
  }

  // methods
  initLeagueMap() {
    const league = this.$store.direct.state.rankings.ladders?.filter(
      (l) =>
        l.gateway === this.$store.direct.state.gateway &&
        l.gameMode === this.$store.direct.state.rankings.gameMode &&
        l.season === this.$store.direct.state.rankings.selectedSeason.id
    )[0];
    this.leagueMap = new Map(league?.leagues.map((l) => [l.id, l]));
  }

  public getRaceIcon(ranking: Ranking, playerIndex: number): string {
    const playersInfo = ranking.playersInfo;
    if (!playersInfo) return this.raceIcon(ERaceEnum.RANDOM);
    const playerInfo = playersInfo[playerIndex];
    if (CountryRankingsGrid.hasSelectedIcon(playerInfo)) {
      return getAvatarUrl(
        playerInfo.selectedRace,
        playerInfo.pictureId,
        playerInfo.isClassicPicture
      );
    } else {
      return this.raceIcon(playerInfo.calculatedRace);
    }
  }

  public getTitleRace(ranking: Ranking, playerIndex: number): TranslateResult {
    const playersInfo = ranking.playersInfo;
    if (!playersInfo) return this.$t("races.RANDOM");
    const playerInfo = playersInfo[playerIndex];
    if (
      CountryRankingsGrid.hasSelectedIcon(playerInfo) &&
      playerInfo.selectedRace <= ERaceEnum.UNDEAD
    ) {
      return this.$t(`races.${ERaceEnum[playerInfo.selectedRace]}`);
    } else {
      return this.$t(`races.${ERaceEnum[playerInfo.calculatedRace]}`);
    }
  }

  private static hasSelectedIcon(playerInfo: PlayerInfo) {
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

  raceIcon(race: ERaceEnum) {
    return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
  }

  isTwitchLive(ranking: Ranking): boolean {
    const twitchName = ranking.playersInfo[0].twitchName;
    const streamData = this.$store.direct.state.twitch.twitchStreamResponse
      .data;
    if (twitchName && streamData) {
      for (let i = 0; i < streamData.length; i++) {
        let stream = streamData[i];
        if (
          stream &&
          stream.user_name.toLowerCase() == twitchName.toLowerCase()
        ) {
          return true;
        }
      }
    }

    return false;
  }

  isCurrentlyLive(playerIds: PlayerId[]): boolean {
    if (!this.ongoingMatches) {
      return false;
    }

    const firstPlayer = playerIds[0].battleTag;
    const foundByFirstPlayer = this.ongoingMatches[firstPlayer] as {
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

  getLiveOpponent(playerIds: PlayerId[]): boolean | string {
    if (!this.ongoingMatches) {
      return false;
    }

    const firstPlayer = playerIds[0].battleTag;
    const foundByFirstPlayer = this.ongoingMatches[firstPlayer] as {
      players: string[];
      opponents: string[];
    };
    if (foundByFirstPlayer) {
      return foundByFirstPlayer.opponents.join(",");
    }

    return "";
  }
}
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

.country-flag__container {
  position: relative;
  display: inline-block;
}

.country-flag {
  top: -10px;
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

.clickable {
  cursor: pointer;
}

.race-icon {
  padding: 0;
}
</style>
