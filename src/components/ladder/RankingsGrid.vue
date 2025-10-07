<template>
  <div class="custom-table-wrapper elevation-1">
    <table class="custom-table">
      <thead>
        <tr>
          <td
            v-for="header in headers"
            :key="header.name"
            class="header"
            :class="{ clickable: header.sortFunction !== undefined }"
            :style="{
              width: header.width,
              'min-width': header.minWidth,
            }"
            @click="sortRankings(header.name, header.sortFunction)"
          >
            {{ header.text }}
            <div v-if="header.text === sortColumn" class="sort-icon">
              <v-icon v-if="isSortedAsc">{{ mdiChevronUp }}</v-icon>
              <v-icon v-if="!isSortedAsc">{{ mdiChevronDown }}</v-icon>
            </div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in rankingsRef"
          :id="`listitem_${item.rankNumber}`"
          :key="item.player.id"
          :class="{
            searchedItem: item.player.id === selectedRankBattleTag(),
          }"
        >
          <td class="number-text">{{ item.rankNumber }}.</td>
          <td class="d-md-flex">
            <div
              v-for="(playerId, index) in item.player.playerIds"
              :key="playerId.battleTag + '_' + item.race"
              class="rank-icon-container my-1"
              :class="{ 'ml-md-3': index > 0 }"
            >
              <div
                class="player-avatar mr-1 alignRight race-icon"
                :title="getTitleRace(item, index).toString()"
                :style="{
                  'background-image': 'url(' + getRaceIcon(item, index) + ')',
                }"
              ></div>
              <player-rank-info :player-id="playerId" :alias="item.playersInfo[index].playerAkaData.name" />
              <div
                v-if="(item.playersInfo && item.playersInfo[index].countryCode) || item.playersInfo[index].location"
                class="ml-1"
              >
                <country-flag-extended
                  :countryCode="item.playersInfo[index].countryCode"
                  :location="item.playersInfo[index].location"
                  size="small"
                />
              </div>
              <div v-if="isTwitchLive(item, index)" class="twitch__container">
                <v-tooltip location="bottom">
                  <template v-slot:activator="{ props }">
                    <span style="display: inline" class="pointer" v-bind="props">
                      <v-btn
                        icon
                        :href="'https:///twitch.tv/' + item.playersInfo[index].twitchName"
                        target="_blank"
                        v-bind="props"
                        class="bg-transparent"
                        variant="flat"
                      >
                        <v-icon
                          v-if="!isCurrentlyLive(item.player.playerIds)"
                          color="purple-accent-4"
                        >
                          {{ mdiTwitch }}
                        </v-icon>
                        <v-icon
                          v-if="isCurrentlyLive(item.player.playerIds)"
                          class="blinker"
                          color="red-accent-4"
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
              <span
                v-if="isCurrentlyLive(item.player.playerIds) && !isTwitchLive(item, index)"
                style="position: relative"
              >
                <v-tooltip location="bottom">
                  <template v-slot:activator="{ props }">
                    <span style="display: inline" class="pointer" v-bind="props">
                      <sword-icon class="swords blinker" />
                    </span>
                  </template>
                  <div>
                    {{ $t("components_ladder_rankingsgrid.nowplayingvs") }}
                    {{ getLiveOpponent(item.player.playerIds) }}
                  </div>
                </v-tooltip>
              </span>
            </div>
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
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, toRefs, watch } from "vue";
import { Ranking, PlayerId, PlayerInfo } from "@/store/ranking/types";
import { EAvatarCategory, ERaceEnum, OngoingMatches } from "@/store/types";
import { useTwitchStore } from "@/store/twitch/store";
import SwordIcon from "@/components/ladder/SwordIcon.vue";
import PlayerRankInfo from "@/components/ladder/PlayerRankInfo.vue";
import CountryFlagExtended from "@/components/common/CountryFlagExtended.vue";
import RaceIcon from "@/components/player/RaceIcon.vue";
import { getAsset, getAvatarUrl } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";
import LevelProgress from "@/components/ladder/LevelProgress.vue";
import { mdiChevronDown, mdiChevronUp, mdiTwitch } from "@mdi/js";
import { useI18n } from "vue-i18n";
import { useRankingStore } from "@/store/ranking/store";
import { useVuetify } from "@/plugins/vuetify";

export default defineComponent({
  name: "RankingsGrid",
  components: {
    RaceIcon,
    SwordIcon,
    PlayerRankInfo,
    CountryFlagExtended,
    LevelProgress,
  },
  props: {
    rankings: {
      type: Array<Ranking>,
      required: true,
    },
    ongoingMatches: {
      type: Object as PropType<OngoingMatches>,
      required: true,
    },
    selectedRank: {
      type: Object as PropType<Ranking>,
      required: true,
    }
  },
  setup(props) {
    const { t } = useI18n();
    const vuetify = useVuetify();
    const twitchStore = useTwitchStore();
    const rankingsStore = useRankingStore();
    const sortColumn = ref<string>("Rank");
    const isSortedAsc = ref<boolean>(true);
    let _lastSortFunction: ((a: Ranking, b: Ranking) => number) | undefined = undefined;
    const sortedRankings = ref<Ranking[]>([]);

    const rankingsRef = computed<Ranking[]>({
      get(): Ranking[] {
        return sortedRankings.value.length > 0 ? sortedRankings.value : rankingsStore.rankings;
      },
      set(val: Ranking[]): void {
        sortedRankings.value = isSortedAsc.value ? val.toSorted(_lastSortFunction) : val.toSorted(_lastSortFunction).reverse();
      },
    });

    const headers = [
      {
        name: "Rank",
        text: t("components_ladder_rankingsgrid.rank"),
        align: "start",
        sortable: false,
        width: "25px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.rankNumber - a.rankNumber;
        },
      },
      {
        name: "Player",
        text: t("components_ladder_rankingsgrid.player"),
        align: "start",
        sortable: false,
        minWidth: "170px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return ("" + b.player.name).localeCompare(a.player.name);
        },
      },
      {
        name: "Level",
        text: t("components_ladder_rankingsgrid.level"),
        align: "center",
        sortable: false,
        width: "100px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.rankingPoints - a.rankingPoints;
        },
      },
      {
        name: "Race",
        text: t("components_ladder_rankingsgrid.race"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.race - a.race;
        },
      },
      {
        name: "Clan",
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
        name: "Wins",
        text: t("components_ladder_rankingsgrid.wins"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.wins - a.player.wins;
        },
      },
      {
        name: "Losses",
        text: t("components_ladder_rankingsgrid.losses"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.losses - a.player.losses;
        },
      },
      {
        name: "Total",
        text: t("components_ladder_rankingsgrid.total"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.games - a.player.games;
        },
      },
      {
        name: "Winrate",
        text: t("components_ladder_rankingsgrid.winrate"),
        align: "end",
        sortable: false,
        width: "50px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.winrate - a.player.winrate;
        },
      },
      {
        name: "MMR",
        text: t("components_ladder_rankingsgrid.mmr"),
        align: "end",
        sortable: false,
        width: "25px",
        sortFunction: (a: Ranking, b: Ranking): number => {
          return b.player.mmr - a.player.mmr;
        },
      },
    ];

    const selectedRankRef = toRefs(props).selectedRank;
    watch(selectedRankRef, onSelectedRankChanged);

    function onSelectedRankChanged(newVal: Ranking): void {
      if (!newVal) {
        return;
      }

      goToRank(newVal);
    }

    const rankingsWatchRef = toRefs(props).rankings;
    watch(rankingsWatchRef, onRankingsChanged);

    function onRankingsChanged(newVal: Ranking[], oldVal: Ranking[]): void {
      if (!newVal) {
        return;
      }

      let triggerTwitchLookup = Boolean(newVal.length != oldVal.length);
      if (!triggerTwitchLookup) {
        for (let i = 0; i < newVal.length; i++) {
          if (newVal[i].player.name != oldVal[i].player.name) {
            triggerTwitchLookup = true;
          }
        }
      }

      if (triggerTwitchLookup) {
        getStreamStatus();
      }

      if (sortColumn.value && _lastSortFunction) {
        sortedRankings.value = isSortedAsc.value ? newVal.sort(_lastSortFunction) : newVal.sort(_lastSortFunction).reverse();
      }
    }

    async function getStreamStatus(): Promise<void> {
      // filter nulls and empty strings
      const twitchNames = [...new Set(props.rankings
        .map((r) => r.playersInfo)
        .map((r) => r.map((i) => i.twitchName))
        .flat())].filter((r) => (r && r.length > 0));

      if (twitchNames.length > 0) {
        await twitchStore.getStreamStatus(twitchNames);
      }
    }

    // get properties
    function selectedRankBattleTag(): string {
      if (!props.selectedRank || !props.selectedRank.player) {
        return "";
      }

      return props.selectedRank.player.id;
    }

    function goToRank(rank: Ranking): void {
      setTimeout(() => {
        const listItemOfPlayer = document.getElementById(`listitem_${rank.rankNumber}`);

        if (!listItemOfPlayer) return;

        vuetify.goTo(listItemOfPlayer, {
          offset: window.innerHeight - 150,
        });
      }, 500);
    }

    function getRaceIcon(ranking: Ranking, playerIndex: number): string {
      const playersInfo = ranking.playersInfo;
      if (!playersInfo) return raceIconImage(ERaceEnum.RANDOM);
      const playerInfo = playersInfo[playerIndex];
      if (hasSelectedIcon(playerInfo)) {
        return getAvatarUrl(
          playerInfo.selectedRace,
          playerInfo.pictureId,
          playerInfo.isClassicPicture
        );
      } else {
        return getAvatarUrl(
          playerInfo.selectedRace,
          playerInfo.pictureId,
          playerInfo.isClassicPicture
        );
        // old way to get race icon: return this.raceIcon(playerInfo.calculatedRace);
      }
    }

    function getTitleRace(ranking: Ranking, playerIndex: number): TranslateResult {
      const playersInfo = ranking.playersInfo;
      if (!playersInfo) return "Random";
      const playerInfo = playersInfo[playerIndex];
      if (
        hasSelectedIcon(playerInfo) &&
        playerInfo.selectedRace <= ERaceEnum.UNDEAD
      ) {
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

    function raceIconImage(race: ERaceEnum) {
      return getAsset(`raceIcons/${ERaceEnum[race]}.jpg`);
    }

    function isTwitchLive(ranking: Ranking, index: number): boolean {
      const twitchName = ranking.playersInfo[index].twitchName;
      const streamData = twitchStore.twitchStreamResponse.data;
      if (twitchName && streamData) {
        for (let i = 0; i < streamData.length; i++) {
          const stream = streamData[i];
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

    function sortRankings(columnName: string, sortFunction: (a: Ranking, b: Ranking) => number): void {
      if (!sortFunction) return;
      if (sortColumn.value === columnName) {
        isSortedAsc.value = !isSortedAsc.value;
      } else {
        isSortedAsc.value = true;
      }

      _lastSortFunction = sortFunction;
      rankingsRef.value = props.rankings;
      sortColumn.value = columnName;
    }

    return {
      mdiChevronUp,
      mdiChevronDown,
      mdiTwitch,
      headers,
      sortColumn,
      isSortedAsc,
      getStreamStatus,
      selectedRankBattleTag,
      goToRank,
      getRaceIcon,
      getTitleRace,
      hasSelectedIcon,
      raceIconImage,
      isTwitchLive,
      isCurrentlyLive,
      getLiveOpponent,
      sortRankings,
      rankingsRef,
    };
  }
});
</script>

<style lang="scss" scoped>
.v-theme--light {
  tr.searchedItem,
  tr.searchedItem:hover {
    background-color: lightblue !important;
  }
}

.v-theme--dark {
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
    margin-left: 0 !important;
    min-width: 10rem;
  }
}

.rank-icon-container {
  display: flex;
  align-items: center;
  /*width: 50%;*/
  /* fix aliases display */
  margin-left: 0 !important;
  min-height: 39px;
}

.d-md-flex {
  height: auto;
  flex-wrap: wrap;
}

td.header {
  position: relative;

  .sort-icon {
    position: absolute;
    bottom: 10px;
    right: -7px;
  }
}

.swords {
  position: absolute;
  top: -10px;
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
