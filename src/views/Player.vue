<template>
  <v-container class="profile">
    <v-row>
      <v-col cols="12">
        <v-card tile>
          <v-card-title>
            <v-row no-gutters>
              <v-col :align-self="'center'">
                <span>{{ $t("views_player.profile") }} {{ profile.battleTag }}</span>
                <span v-if="aliasName" class="ml-1">({{ aliasName }})</span>
                <span class="mr-2" />
                <!-- add some space between name and season badges -->
                <div v-for="season in seasonsWithoutCurrentOne" :key="season.id" class="ml-1 d-inline-block">
                  <season-badge :season="season" :on-click="selectSeason" />
                </div>
              </v-col>
              <v-col :cols="12" :sm="'auto'">
                <div class="ml-3">
                  <gateway-select @gatewayChanged="gatewayChanged" />
                  <v-menu offset-x v-if="!!seasons && seasons.length > 0">
                    <template v-slot:activator="{ on }">
                      <v-btn tile v-on="on" class="ma-2 transparent">
                        <span class="pa-0" v-if="selectedSeason">
                          {{ $t("views_rankings.season") }}
                          {{ selectedSeason.id }}
                        </span>
                      </v-btn>
                    </template>

                    <v-card>
                      <v-list>
                        <v-subheader>
                          {{ $t("views_player.prevseasons") }}
                        </v-subheader>
                        <v-list-item v-for="item in seasons" :key="item.id" @click="selectSeason(item)">
                          <v-list-item-content>
                            <v-list-item-title>{{ $t("views_rankings.season") }} {{ item.id }}</v-list-item-title>
                          </v-list-item-content>
                        </v-list-item>
                      </v-list>
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
            </v-row>
          </v-card-title>
          <div class="live-match__container" v-if="ongoingMatch.id" :class="ongoingMatchGameModeClass">
            <div class="live-match__indicator">
              Live
              <span class="circle red blinker"></span>
              <span class="live-match__duration">{{ getDuration(ongoingMatch) }}'</span>
            </div>
            <div v-if="!isOngoingMatchFFA">
              <div class="live-match__team1">
                <team-match-info
                  :not-clickable="isOngoingMatchFFA"
                  :team="getPlayerTeam(ongoingMatch)"
                  :unfinishedMatch="true"
                  :left="true"
                ></team-match-info>
              </div>
              <div class="live-match__vstext">VS</div>
              <div class="live-match__team2">
                <team-match-info
                  :not-clickable="isOngoingMatchFFA"
                  :team="getOpponentTeam(ongoingMatch)"
                  :unfinishedMatch="true"
                  right="true"
                ></team-match-info>
              </div>
            </div>
            <div v-if="isOngoingMatchFFA" class="live-match__ffa">
              {{ $t("views_player.playingFFA") }}
            </div>
            <span class="live-match__map">
              {{ mapNameFromMatch(ongoingMatch) }}
            </span>
          </div>

          <v-container style="padding-top: 6px">
            <v-row align="center" justify="center">
              <host-icon
                v-if="ongoingMatch.serverInfo && ongoingMatch.serverInfo.provider"
                :host="ongoingMatch.serverInfo"
              ></host-icon>
            </v-row>
          </v-container>

          <v-tabs v-model="tabsModel">
            <v-tabs-slider></v-tabs-slider>
            <v-tab exact class="profileTab" :to="`/player/${encodeURIComponent(battleTag)}`">
              {{ $t("views_player.profile") }}
            </v-tab>
            <v-tab class="profileTab" :to="`/player/${encodeURIComponent(battleTag)}/matches`">
              {{ $t("views_player.matchhistory") }}
            </v-tab>
            <v-tab class="profileTab" :to="`/player/${encodeURIComponent(battleTag)}/at-teams`">
              {{ $t("views_player.teams") }}
            </v-tab>
            <v-tab class="profileTab" :to="`/player/${encodeURIComponent(battleTag)}/statistics`">
              {{ $t("views_player.statistics") }}
            </v-tab>
            <v-tab class="profileTab" :to="`/player/${encodeURIComponent(battleTag)}/clan`">
              {{ $t("views_player.clan") }}
            </v-tab>
          </v-tabs>
          <router-view></router-view>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { PlayerProfile } from "@/store/player/types";
import { EGameMode, ERaceEnum, Match, PlayerInTeam, Team } from "@/store/types";
import { Season } from "@/store/ranking/types";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import AppConstants from "../constants";
import HostIcon from "@/components/matches/HostIcon.vue";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { mapNameFromMatch } from "@/mixins/MatchMixin";
import { usePlayerStore } from "@/store/player/store";
import { useRankingStore } from "@/store/ranking/store";

export default defineComponent({
  name: "PlayerView",
  components: {
    SeasonBadge,
    GatewaySelect,
    TeamMatchInfo,
    HostIcon,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
    freshLogin: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  setup(props) {
    const playerStore = usePlayerStore();
    const rankingsStore = useRankingStore();
    let _intervalRefreshHandle: NodeJS.Timeout;
    const tabsModel = ref<number>(0);

    const seasons = computed<Season[]>(() => playerStore.playerProfile.participatedInSeasons);
    const profile = computed<PlayerProfile>(() => playerStore.playerProfile);
    const selectedSeason = computed<Season>(() => playerStore.selectedSeason);
    const battleTag = computed<string>(() => decodeURIComponent(props.id));
    const ongoingMatch = computed<Match>(() => playerStore.ongoingMatch);

    const isOngoingMatchFFA = computed<boolean>(() => {
      const ffaModes = [EGameMode.GM_FFA, EGameMode.GM_SC_FFA_4];
      return ongoingMatch.value && ffaModes.includes(ongoingMatch.value.gameMode);
    });

    const aliasName = computed<string | false>(() => {
      if (playerStore.playerProfile.playerAkaData != null) {
        return playerStore.playerProfile.playerAkaData.name ?? false;
      }
      return false;
    });

    const seasonsWithoutCurrentOne = computed<Season[]>(() => {
      if (!seasons.value) return [];
      return seasons.value.filter((s) => s.id !== rankingsStore.seasons[0]?.id).reverse();
    });

    const ongoingMatchGameModeClass = computed<string>(() => {
      if (!ongoingMatch.value.id) return "";

      switch (ongoingMatch.value.gameMode) {
        case EGameMode.GM_1ON1: {
          return "one-v-one";
        }
        case EGameMode.GM_2ON2_AT:
        case EGameMode.GM_2ON2: {
          return "two-v-two-at";
        }
        case EGameMode.GM_4ON4: {
          return "four-v-four";
        }
        case EGameMode.GM_FFA:
        case EGameMode.GM_SC_FFA_4: {
          return "ffa";
        }
      }

      return "";
    });

    function getDuration(match: Match): number {
      const today = new Date();
      const diffMs = today.getTime() - new Date(match.startTime.toString()).getTime(); // milliseconds between now & Christmas
      const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes

      return diffMins;
    }

    function getPlayerTeam(match: Match): Team | undefined {
      if (!match.teams) {
        return {} as Team;
      }

      return match.teams.find((team: Team) =>
        team.players.some((player: PlayerInTeam) => player.battleTag === battleTag.value)
      );
    }

    function getOpponentTeam(match: Match): Team | undefined {
      if (!match.teams) {
        return {} as Team;
      }

      return match.teams.find(
        (team: Team) => !team.players.some((player: PlayerInTeam) => player.battleTag === battleTag.value)
      );
    }

    async function selectSeason(season: Season): Promise<void> {
      playerStore.SET_SELECTED_SEASON(season);
      await loadAllDataForSelectedSeason();
      // This requires loadGameModeStats and loadRaceStats to be called first
      await initMmrRpTimeline();
    }

    function gatewayChanged() {
      playerStore.reloadPlayer();
    }

    function stopLoadingMatches() {
      playerStore.SET_ONGOING_MATCH({} as Match);
      clearInterval(_intervalRefreshHandle);
    }

    onMounted((): void => {
      // Since # is a reserver character for the "fragment/hash" part of the URL
      // we can try to redirect to the correct URL if the hash is a battle tag,
      // (starts with at least 4 digits). It may also be followed by a tab name,
      // for example Someone#9999/matches would redirect to Someone%239999/matches
      if (window.location.hash.match(/^#\d{4}/)) {
        const url = new URL(window.location.href);
        url.pathname = `${url.pathname}${url.hash}`;
        url.hash = "";
        window.location.href = url.toString();
      }
    });

    onUnmounted((): void => {
      stopLoadingMatches();
    });

    watch(battleTag, init, { immediate: true });

    async function init() {
      // This is needed because the view is not destroyed when going from a profile directly to another profile, leading to multiple interval timers.
      if (_intervalRefreshHandle) {
        stopLoadingMatches();
      }

      playerStore.SET_BATTLE_TAG(battleTag.value);

      _intervalRefreshHandle = setInterval(async () => {
        await playerStore.loadOngoingPlayerMatch(battleTag.value);
      }, AppConstants.ongoingMatchesRefreshInterval);

      await playerStore.loadOngoingPlayerMatch(battleTag.value);

      if (profile.value && battleTag.value === profile.value.battleTag) return;

      await playerStore.loadProfile({ battleTag: battleTag.value, freshLogin: props.freshLogin });
      await loadAllDataForSelectedSeason();
      await initMmrRpTimeline();
      window.scrollTo(0, 0);
    }

    async function loadAllDataForSelectedSeason() {
      await Promise.all([
        playerStore.loadGameModeStats({}),
        playerStore.loadRaceStats(),
        playerStore.loadMatches(1),
        playerStore.loadPlayerStatsRaceVersusRaceOnMap(battleTag.value),
        playerStore.loadPlayerStatsHeroVersusRaceOnMap(battleTag.value),
        playerStore.loadPlayerGameLengths(),
        rankingsStore.retrieveActiveGameModes(),
      ]);
    }

    async function initMmrRpTimeline() {
      // Make a lookup table for active game modes
      const activeGameModesMap = rankingsStore.activeModes.reduce((acc, mode) => {
        acc[mode.id] = true;
        return acc;
      }, {} as Record<number, boolean>);

      let maxMode = EGameMode.GM_1ON1;
      let maxModeGames = 0;
      playerStore.gameModeStats.forEach((m) => {
        if (!activeGameModesMap[m.gameMode]) return;
        if (m.games > maxModeGames) {
          maxModeGames = m.games;
          maxMode = m.gameMode;
        }
      });
      playerStore.SET_PROFILE_STATISTICS_GAME_MODE(maxMode);

      let maxRace = ERaceEnum.HUMAN;
      let maxRaceGames = 0;
      playerStore.raceStats.forEach((r) => {
        if (r.games > maxRaceGames) {
          maxRaceGames = r.games;
          maxRace = r.race;
        }
      });
      playerStore.SET_PROFILE_STATISTICS_RACE(maxRace);

      await playerStore.loadPlayerMmrRpTimeline();
    }

    return {
      mapNameFromMatch,
      profile,
      aliasName,
      seasonsWithoutCurrentOne,
      selectSeason,
      gatewayChanged,
      seasons,
      selectedSeason,
      ongoingMatch,
      ongoingMatchGameModeClass,
      getDuration,
      isOngoingMatchFFA,
      getPlayerTeam,
      getOpponentTeam,
      tabsModel,
      battleTag,
    };
  },
});
</script>

<style lang="scss" scoped>
.red {
  background-color: red;
  position: absolute;
  top: 5px;
  left: 28px;
}

.profileTab {
  background-color: #f5f5f5;
}

.theme--dark {
  .profileTab {
    background-color: #2f2f2f;
  }
}

.playerTag {
  margin-left: 10px;
  text-transform: none;
}

.live-match__container {
  position: relative;
  max-width: 500px;
  margin: 20px auto;
  height: 44px;

  .live-match__indicator {
    position: absolute;
    left: calc(50% - 28px);
    top: -25px;
    font-size: 13px;
  }

  .live-match__team1 {
    position: absolute;
    left: 0;
    width: 45%;
  }

  .live-match__team2 {
    position: absolute;
    right: 0;
    width: 45%;
  }

  .live-match__vstext {
    position: absolute;
    left: calc(50% - 10px);
    top: calc(50% - 20px);
  }

  .live-match__ffa {
    position: absolute;
    left: calc(50% - 41px);
  }

  .live-match__map {
    position: absolute;
    top: 28px;
    font-size: 12px;
    left: calc(50% - 60px);
    text-align: center;
    width: 120px;
  }

  .live-match__duration {
    position: absolute;
    left: 44px;
  }

  &.one-v-one {
    .live-match__map {
      top: 33px;
    }
  }
  &.two-v-two-at {
    height: 67px;
    .live-match__map {
      top: 65px;
    }
  }
  &.four-v-four {
    height: 135px;
    .live-match__map {
      top: 130px;
    }
  }
}
</style>
