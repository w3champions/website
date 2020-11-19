<template>
  <div class="custom-table-wrapper elevation-1">
    <table class="custom-table">
      <thead>
        <tr>
          <td
            class="header"
            v-bind:class="{ clickable: header.sortFunction !== undefined }"
            v-for="header in headers"
            :key="header.text"
            v-bind:style="{
              width: header.width,
              'min-width': header.minWidth,
            }"
            v-on:click="sortRankings(header.text, header.sortFunction)"
          >
            {{ header.text }}
            <div v-if="header.text == sortColumn" class="sort-icon">
              <v-icon v-if="isSortedAsc">mdi-chevron-up</v-icon>
              <v-icon v-if="!isSortedAsc">mdi-chevron-down</v-icon>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          :id="`listitem_${item.rankNumber}`"
          v-for="item in sortedRankings"
          :key="item.player.id"
          :class="{
            searchedItem: item.player.id === selectedRankBattleTag,
          }"
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
              <div class="twitch__container" v-if="isTwitchLive(item)">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <span style="display: inline;" class="pointer" v-on="on">
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
                    Streaming a match versus
                    {{ getLiveOpponent(item.player.playerIds) }}
                  </div>
                  <div v-if="!isCurrentlyLive(item.player.playerIds)">
                    Stream is live!
                  </div>
                </v-tooltip>
              </div>
            </div>
            <span
              style="position: relative;"
              v-if="
                isCurrentlyLive(item.player.playerIds) && !isTwitchLive(item)
              "
            >
              <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                  <span style="display: inline;" class="pointer" v-on="on">
                    <sword-icon class="swords blinker" />
                  </span>
                </template>
                <div>
                  Now playing vs
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import { Ranking, PlayerId, PlayerInfo } from "@/store/ranking/types";
import { EAvatarCategory, EGameMode, ERaceEnum, Match } from "@/store/typings";
import PlayerIcon from "@/components/matches/PlayerIcon.vue";
import SwordIcon from "@/components/ladder/SwordIcon.vue";

import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import { ECountries } from "@/store/countries";
import { TwitchStreamResponse } from "../../store/twitch/types";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { getAvatarUrl } from "@/helpers/url-functions";

@Component({
  components: {
    RaceIcon,
    PlayerIcon,
    SwordIcon,
    PlayerRankInfo,
    CountryFlagExtended,
  },
})
export default class RankingsGrid extends Vue {
  @Prop() rankings!: Ranking[];
  @Prop() ongoingMatches!: any;
  @Prop() selectedRank!: Ranking;

  public gameModes = EGameMode;

  public headers = [
    {
      text: "Rank",
      align: "start",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.rankNumber - a.rankNumber;
      },
    },
    {
      text: "Player",
      align: "start",
      sortable: false,
      minWidth: "170px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return ("" + b.player.name).localeCompare(a.player.name);
      },
    },
    {
      text: "Race",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.race - a.race;
      },
    },
    {
      text: "Clan",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return ("" + b.playersInfo[0].clanId).localeCompare(
          a.playersInfo[0].clanId
        );
      },
    },
    {
      text: "Wins",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.player.wins - a.player.wins;
      },
    },
    {
      text: "Losses",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.player.losses - a.player.losses;
      },
    },
    {
      text: "Total",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.player.games - a.player.games;
      },
    },
    {
      text: "Winrate",
      align: "end",
      sortable: false,
      width: "50px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.player.winrate - a.player.winrate;
      },
    },
    {
      text: "MMR",
      align: "end",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.player.mmr - a.player.mmr;
      },
    },
    {
      text: "RP",
      align: "end",
      sortable: false,
      width: "25px",
      sortFunction: (a: Ranking, b: Ranking) => {
        return b.rankingPoints - a.rankingPoints;
      },
    },
  ];

  public sortedRankings: Ranking[] = this.rankings;
  public sortColumn = "Rank";
  public isSortedAsc = true;
  private _lastSortFunction: any = null;

  @Watch("selectedRank")
  public onSelectedRankChanged(newVal: Ranking) {
    if (!newVal) {
      return;
    }

    this.goToRank(newVal);
  }

  @Watch("rankings")
  public onRankingsChanged(newVal: Ranking[], oldVal: Ranking[]) {
    if (!newVal) {
      return;
    }

    if (newVal == this.sortedRankings) {
      return;
    }

    let triggerTwitchLookup = false;
    if (newVal.length != oldVal.length) {
      triggerTwitchLookup = true;
    } else {
      for (let i = 0; i < newVal.length; i++) {
        if (newVal[i].player.name != oldVal[i].player.name) {
          triggerTwitchLookup = true;
        }
      }
    }

    if (triggerTwitchLookup) {
      this.getStreamStatus();
    }

    this.sortedRankings = newVal;

    if (this._lastSortFunction) {
      this._lastSortFunction();
    }
  }

  public async getStreamStatus() {
    let twitchNames = this.rankings
      .map((r) => r.playersInfo[0].twitchName)
      .filter((r) => {
        return r != null && r != "";
      });

    if (twitchNames.length > 0) {
      await this.$store.direct.dispatch.twitch.getStreamStatus(twitchNames);
    }
  }

  // get properties
  get selectedRankBattleTag() {
    if (!this.selectedRank || !this.selectedRank.player) {
      return "";
    }

    return this.selectedRank.player.id;
  }

  // methods
  public async goToRank(rank: Ranking) {
    setTimeout(() => {
      const listItemOfPlayer = document.getElementById(
        `listitem_${rank.rankNumber}`
      );

      if (!listItemOfPlayer) return;

      this.$vuetify.goTo(listItemOfPlayer, {
        offset: window.innerHeight - 150,
      });
    }, 500);
  }

  public getRaceIcon(ranking: Ranking, playerIndex: number) {
    const playersInfo = ranking.playersInfo;
    if (!playersInfo) return this.raceIcon(ERaceEnum.RANDOM);
    const playerInfo = playersInfo[playerIndex];
    if (this.hasSelectedIcon(playerInfo)) {
      return getAvatarUrl(
        playerInfo.selectedRace,
        playerInfo.pictureId,
        playerInfo.isClassicPicture
      );
    } else {
      return this.raceIcon(playerInfo.calculatedRace);
    }
  }

  public getTitleRace(ranking: Ranking, playerIndex: number) {
    const playersInfo = ranking.playersInfo;
    if (!playersInfo) return "Random";
    const playerInfo = playersInfo[playerIndex];
    if (
      this.hasSelectedIcon(playerInfo) &&
      playerInfo.selectedRace <= ERaceEnum.UNDEAD
    ) {
      return this.$t(`races.${ERaceEnum[playerInfo.selectedRace]}`);
    } else {
      return this.$t(`races.${ERaceEnum[playerInfo.calculatedRace]}`);
    }
  }

  private hasSelectedIcon(playerInfo: PlayerInfo) {
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
    return require("../../assets/raceIcons/" + ERaceEnum[race] + ".jpg");
  }

  public isTwitchLive(ranking: Ranking) {
    var twitchName = ranking.playersInfo[0].twitchName;
    var streamData = this.$store.direct.state.twitch.twitchStreamResponse.data;
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

  public isCurrentlyLive(playerIds: PlayerId[]) {
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

  public getLiveOpponent(playerIds: PlayerId[]) {
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

  public sortRankings(columnName: string, sortFunction: any) {
    if (sortFunction) {
      if (this.sortColumn === columnName) {
        this.isSortedAsc = !this.isSortedAsc;
      } else {
        this.isSortedAsc = true;
      }

      const sortFn = () => {
        this.sortColumn = columnName;
        this.sortedRankings.sort(sortFunction);
        if (this.isSortedAsc) {
          this.sortedRankings = this.sortedRankings.reverse();
        }
      };
      this._lastSortFunction = sortFn;
      sortFn();
    }
  }

  getCountryCode(playerInfo: PlayerInfo): string {
    if (playerInfo.countryCode) {
      return playerInfo.countryCode;
    } else if (playerInfo.location) {
      return playerInfo.location;
    }

    return "";
  }
}
</script>

<style lang="scss" scoped>
.theme--light {
  tr.searchedItem,
  tr.searchedItem:hover {
    background-color: lightblue !important;
  }
}
.theme--dark {
  tr.searchedItem,
  tr.searchedItem:hover {
    background-color: #310e6f !important;
  }
}

.red {
  left: 10px;
}

@media (max-width: 768px) {
  .rank-icon-container {
    margin-top: 5px;
    margin-left: 0px !important;
  }
}

td.header {
  position: relative;

  .sort-icon {
    position: absolute;
    top: 10px;
    right: -7px;
  }
}

.country-flag__container {
  position: relative;
  display: inline-block;
}

.twitch__container {
  position: relative;
  display: inline-block;
  left: 8px;
}

::v-deep .country-flag {
  position: absolute;
  top: -10px;
}

.twitch-icon {
  position: absolute;
  top: -5px;
  left: 10px;
}

.swords {
  position: absolute;
  top: 0px;
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
