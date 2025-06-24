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
                <span class="mr-2"></span>
                <!-- add some space between name and season badges -->
                <div v-for="season in seasonsReversed" :key="season.id" class="ml-1 d-inline-block">
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
          <v-container class="pt-0" v-if="ongoingMatch.id">
            <v-row justify="center">
              <div class="d-flex justify-center" style="font-size: 0.9rem">
                <span>Live</span>
                <span class="live-match__indicator circle blinker"></span>
                <span class="live-match__duration">{{ getDuration(ongoingMatch) }}</span>
              </div>
            </v-row>
            <v-row justify="center">
              <div class="d-flex justify-center align-center" v-if="!isOngoingMatchFFA">
                <div class="live-match__team">
                  <team-match-info
                    :not-clickable="isOngoingMatchFFA"
                    :team="getPlayerTeam(ongoingMatch)"
                    :unfinishedMatch="true"
                    :left="true"
                  ></team-match-info>
                </div>
                <div class="ml-3 mr-3">
                  <span>VS</span>
                </div>
                <div class="live-match__team">
                  <team-match-info
                    :not-clickable="isOngoingMatchFFA"
                    :team="getOpponentTeam(ongoingMatch)"
                    :unfinishedMatch="true"
                    right="true"
                  ></team-match-info>
                </div>
              </div>
              <div v-else class="live-match__ffa">
                {{ $t("views_player.playingFFA") }}
              </div>
            </v-row>
            <v-row justify="center">
              <div class="d-flex justify-center" style="font-size: 0.9rem">
                <span>
                  {{ mapNameFromMatch(ongoingMatch) }}
                </span>
              </div>
            </v-row>
            <v-row justify="center">
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
import { GAME_MODES_FFA } from "@/store/constants";

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
      return ongoingMatch.value && GAME_MODES_FFA.includes(ongoingMatch.value.gameMode);
    });

    const aliasName = computed<string | false>(() => {
      if (playerStore.playerProfile.playerAkaData != null) {
        return playerStore.playerProfile.playerAkaData.name ?? false;
      }
      return false;
    });

    const seasonsReversed = computed<Season[]>(() => {
      if (!seasons.value) return [];
      return seasons.value.slice().reverse();
    });

    function getDuration(match: Match): string {
      const now = new Date();
      const start = new Date(match.startTime.toString());
      const diffMs = now.getTime() - start.getTime();

      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
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
      // Since # is a reserved character for the "fragment/hash" part of the URL
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
      seasonsReversed,
      selectSeason,
      gatewayChanged,
      seasons,
      selectedSeason,
      ongoingMatch,
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
.live-match__indicator {
  background-color: red;
  margin-top: 7px;
  margin-left: 5px;
  margin-right: 5px;
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

.live-match__team {
  width: 300px;
}

</style>
