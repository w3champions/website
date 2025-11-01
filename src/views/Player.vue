<template>
  <v-container class="pa-3 w3-container-width">
    <v-row>
      <v-col>
        <v-card tile>
          <v-card-title>
            <v-row no-gutters>
              <v-col class="d-flex flex-wrap">
                <div class="mt-1">
                  <span>{{ $t("views_player.profile") }} {{ profile.battleTag }}</span>
                  <span v-if="aliasName" class="ml-1">({{ aliasName }})</span>
                </div>

                <!-- Moderation status badges -->
                <moderation-status-badges
                  v-if="hasModerationPermission && !loadingModerationStatus && profile.battleTag"
                  :battle-tag="profile.battleTag"
                  :compact="true"
                  class="ml-3"
                />
                <v-progress-circular v-else-if="hasModerationPermission && loadingModerationStatus" indeterminate size="20" width="2" class="ml-3" />

                <div v-for="season in seasonsReversed" :key="season.id" class="ml-1 d-inline-block">
                  <season-badge :season="season" :on-click="selectSeason" />
                </div>
              </v-col>
              <div class="position-static right-0 mt-2 ml-1">
                <gateway-select @gatewayChanged="gatewayChanged" />
                <v-menu v-if="!!seasons && seasons.length > 0" location="right">
                  <template v-slot:activator="{ props }">
                    <v-btn tile class="ml-2 bg-transparent" v-bind="props">
                      <span v-if="selectedSeason" class="pa-0">
                        {{ $t("views_rankings.season") }}
                        {{ selectedSeason.id }}
                      </span>
                    </v-btn>
                  </template>

                  <v-card>
                    <v-list>
                      <v-list-subheader>
                        {{ $t("views_player.prevseasons") }}
                      </v-list-subheader>
                      <v-list-item v-for="item in seasons" :key="item.id" @click="selectSeason(item)">
                        <v-list-item-title>{{ $t("views_rankings.season") }} {{ item.id }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-card>
                </v-menu>
              </div>
            </v-row>
          </v-card-title>
          <v-container v-if="ongoingMatch.id" class="pt-0">
            <v-row justify="center">
              <div class="d-flex justify-center" style="font-size: 0.9rem">
                <span>Live</span>
                <span class="live-match__indicator circle blinker"></span>
                <span class="live-match__duration">{{ getDuration(ongoingMatch) }}</span>
              </div>
            </v-row>
            <v-row justify="center">
              <div v-if="!isOngoingMatchFFA" class="d-flex align-center">
                <div class="live-match__team">
                  <team-match-info
                    :not-clickable="isOngoingMatchFFA"
                    :team="getPlayerTeam(ongoingMatch)"
                    :unfinishedMatch="true"
                    :left="true"
                  />
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
                  />
                </div>
              </div>
              <div v-else class="live-match__ffa">
                {{ $t("views_player.playingFFA") }}
              </div>
            </v-row>
            <v-row justify="center">
              <div style="font-size: 0.9rem">
                <span>
                  {{ mapNameFromMatch(ongoingMatch) }}
                </span>
              </div>
            </v-row>
            <v-row justify="center">
              <host-icon
                v-if="ongoingMatch.serverInfo && ongoingMatch.serverInfo.provider"
                :host="ongoingMatch.serverInfo"
              />
            </v-row>
          </v-container>

          <v-tabs v-model="tabsModel">
            <v-tab exact :to="`/player/${encodeURIComponent(battleTag)}`">
              {{ $t("views_player.profile") }}
            </v-tab>
            <v-tab :to="`/player/${encodeURIComponent(battleTag)}/matches`">
              {{ $t("views_player.matchhistory") }}
            </v-tab>
            <v-tab :to="`/player/${encodeURIComponent(battleTag)}/at-teams`">
              {{ $t("views_player.teams") }}
            </v-tab>
            <v-tab :to="`/player/${encodeURIComponent(battleTag)}/statistics`">
              {{ $t("views_player.statistics") }}
            </v-tab>
            <v-tab :to="`/player/${encodeURIComponent(battleTag)}/clan`">
              {{ $t("views_player.clan") }}
            </v-tab>
          </v-tabs>
          <router-view />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { PlayerProfile } from "@/store/player/types";
import { Match, PlayerInTeam, Team } from "@/store/types";
import { Season } from "@/store/ranking/types";
import GatewaySelect from "@/components/common/GatewaySelect.vue";
import TeamMatchInfo from "@/components/matches/TeamMatchInfo.vue";
import AppConstants from "../constants";
import HostIcon from "@/components/matches/HostIcon.vue";
import SeasonBadge from "@/components/player/SeasonBadge.vue";
import { mapNameFromMatch } from "@/composables/MatchMixin";
import ModerationStatusBadges from "@/components/admin/smurf-detection/ModerationStatusBadges.vue";
import { usePlayerStore } from "@/store/player/store";
import { useAdminStore } from "@/store/admin/store";
import { useOauthStore } from "@/store/oauth/store";
import { EPermission } from "@/store/admin/permission/types";
import { GAME_MODES_FFA } from "@/store/constants";

export default defineComponent({
  name: "PlayerView",
  components: {
    SeasonBadge,
    GatewaySelect,
    TeamMatchInfo,
    HostIcon,
    ModerationStatusBadges,
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
    const adminStore = useAdminStore();
    const oauthStore = useOauthStore();
    let _intervalRefreshHandle: NodeJS.Timeout;
    const tabsModel = ref<number>(0);
    const loadingModerationStatus = ref<boolean>(false);

    const seasons = computed<Season[]>(() => playerStore.playerProfile.participatedInSeasons);
    const profile = computed<PlayerProfile>(() => playerStore.playerProfile);
    const selectedSeason = computed<Season>(() => playerStore.selectedSeason);
    const battleTag = computed<string>(() => decodeURIComponent(props.id));
    const ongoingMatch = computed<Match>(() => playerStore.ongoingMatch);
    const permissions = computed<string[]>(() => oauthStore.permissions);
    const hasModerationPermission = computed(() => permissions.value.includes(EPermission[EPermission.Moderation]));

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
      await playerStore.loadAllDataForSelectedSeason();
      // This requires loadGameModeStats and loadRaceStats to be called first
      await playerStore.initMmrRpTimeline();
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

      _intervalRefreshHandle = setInterval(async () => {
        await playerStore.loadOngoingPlayerMatch(battleTag.value);
      }, AppConstants.ongoingMatchesRefreshInterval);

      await playerStore.loadOngoingPlayerMatch(battleTag.value);

      if (profile.value && battleTag.value === profile.value.battleTag) return;

      await playerStore.loadFullProfile({ battleTag: battleTag.value, freshLogin: props.freshLogin });

      // Load moderation data if user has permission
      if (hasModerationPermission.value) {
        loadingModerationStatus.value = true;
        try {
          await adminStore.loadModerationStatusForBattleTags([battleTag.value]);
        } finally {
          loadingModerationStatus.value = false;
        }
      }

      window.scrollTo(0, 0);
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
      hasModerationPermission,
      loadingModerationStatus,
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

.playerTag {
  margin-left: 10px;
  text-transform: none;
}

.live-match__team {
  width: 300px;
}

:deep(.v-tabs .v-slide-group__content) {
  border-bottom: 1px solid #cdcdcd;
}

.circle {
  border-radius: 50%;
  width: 10px;
  height: 10px;
}
</style>
