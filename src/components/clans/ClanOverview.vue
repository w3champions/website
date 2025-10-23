<template>
  <v-card-text>
    <div v-if="hasNoClan && !isLoggedInPlayer">
      <v-row class="justify-center">
        <v-col class="text-center">
          <v-card-subtitle>
            {{ $t("components_clans_clanoverview.playerhasnoclan") }}
          </v-card-subtitle>
        </v-col>
      </v-row>
    </div>
    <accept-invite-panel v-if="hasPendingInvite && isLoggedInPlayer" />
    <clan-creation-panel v-if="!hasPendingInvite && hasNoClan && isLoggedInPlayer" />
    <div v-if="!hasNoClan">
      <v-card-title class="justify-space-between">
        <span>{{ playersClan.clanName }} ({{ playersClan.clanId }})</span>
        <invite-player-modal v-if="loggedInPlayerIsShaman" />
      </v-card-title>
      <br />
      <br />
      <v-row v-if="clanIsFunded">
        <v-col
          v-for="mode in [
            EGameMode.GM_1ON1,
            EGameMode.GM_2ON2,
            EGameMode.GM_2ON2_AT,
            EGameMode.GM_4ON4,
            EGameMode.GM_FFA,
          ]"
          :key="mode"
        >
          <player-league :small-mode="true" :show-performance="false" :mode-stat="getStats(mode)" />
        </v-col>
      </v-row>
      <br />
      <div v-if="playersClan.isSuccesfullyFounded">
        <table class="custom-table">
          <tr @click="goToPlayer(playersClan.chiefTain)">
            <td>
              <v-row class="justify-space-between align-center ma-0">
                <v-col class="pa-0">
                  <clan-role-icon :role="roleEnums.ChiefTain" />
                  <span class="cursor-pointer" @click="goToPlayer(playersClan.chiefTain)">
                    {{ battleTagToName(playersClan.chiefTain) }}
                  </span>
                  <v-tooltip location="top" :disabled="!getLeagueOrder(playersClan.chiefTain)">
                    <template v-slot:activator="{ props }">
                      <div style="display: inline">
                        <league-icon class="ml-4 mb-1" :league="getLeagueOrder(playersClan.chiefTain)" v-bind="props" />
                      </div>
                    </template>
                    <div>1 vs 1</div>
                  </v-tooltip>
                </v-col>
              </v-row>
            </td>
          </tr>
        </table>
        <table class="custom-table">
          <tr v-for="shaman in shamans" :key="shaman" @click="goToPlayer(shaman)">
            <td>
              <v-row class="justify-space-between align-center ma-0">
                <v-col class="pa-0">
                  <clan-role-icon :role="roleEnums.Shaman" />
                  <span class="cursor-pointer" @click="goToPlayer(shaman)">
                    {{ battleTagToName(shaman) }}
                  </span>
                  <v-tooltip location="top" :disabled="!getLeagueOrder(shaman)">
                    <template v-slot:activator="{ props }">
                      <div style="display: inline">
                        <league-icon class="ml-4 mb-1" :league="getLeagueOrder(shaman)" v-bind="props" />
                      </div>
                    </template>
                    <div>1 vs 1</div>
                  </v-tooltip>
                </v-col>
                <v-col class="text-right pa-0">
                  <member-management-menu
                    v-if="loggedInPlayerIsChiefTain"
                    :battle-tag="shaman"
                    :role="defineRole(shaman)"
                    :logged-in-user-role="loggedInRole"
                  />
                </v-col>
              </v-row>
            </td>
          </tr>
        </table>
        <table class="custom-table">
          <tr v-for="member in members" :key="member" @click="goToPlayer(member)">
            <td>
              <v-row class="justify-space-between align-center ma-0">
                <v-col class="pa-0">
                  <clan-role-icon :role="roleEnums.Member" />
                  <span class="cursor-pointer" @click="goToPlayer(member)">
                    {{ battleTagToName(member) }}
                  </span>
                  <v-tooltip location="top" :disabled="!getLeagueOrder(member)">
                    <template v-slot:activator="{ props }">
                      <div style="display: inline">
                        <league-icon class="ml-4 mb-1" :league="getLeagueOrder(member)" v-bind="props" />
                      </div>
                    </template>
                    <div>1 vs 1</div>
                  </v-tooltip>
                </v-col>
                <v-col class="text-right pa-0">
                  <member-management-menu
                    v-if="loggedInPlayerIsShaman"
                    :battle-tag="member"
                    :role="defineRole(member)"
                    :logged-in-user-role="loggedInRole"
                  />
                </v-col>
              </v-row>
            </td>
          </tr>
        </table>
      </div>
      <div v-if="!playersClan.isSuccesfullyFounded">
        <v-card-title>
          {{ $t("components_clans_clanoverview.signeecounter") }} ({{ playersClan.foundingFathers.length }} / 2):
        </v-card-title>
        <table class="custom-table">
          <tr v-for="member in playersClan.foundingFathers" :key="member">
            <td>
              <span class="cursor-pointer" @click="goToPlayer(member)">{{ battleTagToName(member) }}</span>
            </td>
          </tr>
        </table>
      </div>
      <pending-invites-panel v-if="loggedInPlayerIsShaman" />
      <leave-clan-modal v-if="isLoggedInPlayer" :is-chieftain="loggedInPlayerIsChiefTain" />
      <delete-clan-modal v-if="loggedInPlayerIsChiefTain" />
    </div>
  </v-card-text>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";
import InvitePlayerModal from "@/components/clans/InvitePlayerModal.vue";
import PendingInvitesPanel from "@/components/clans/PendingInvitesPanel.vue";
import AcceptInvitePanel from "@/components/clans/AcceptInvitePanel.vue";
import LeaveClanModal from "@/components/clans/LeaveClanModal.vue";
import MemberManagementMenu from "@/components/clans/MemberManagementMenu.vue";
import { Clan, EClanRole } from "@/store/clan/types";
import DeleteClanModal from "@/components/clans/DeleteClanModal.vue";
import { EGameMode } from "@/store/types";
import LeagueIcon from "@/components/ladder/LeagueIcon.vue";
import ClanRoleIcon from "@/components/clans/ClanRoleIcon.vue";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { ModeStat } from "@/store/player/types";
import { getProfileUrl } from "@/helpers/url-functions";
import { useOauthStore } from "@/store/oauth/store";
import { useRankingStore } from "@/store/ranking/store";
import { usePlayerStore } from "@/store/player/store";
import { useClanStore } from "@/store/clan/store";
import { useRouter } from "vue-router";
import { battleTagToName } from "@/helpers/profile";

export default defineComponent({
  name: "ClanOverview",
  components: {
    PlayerLeague,
    ClanRoleIcon,
    LeagueIcon,
    DeleteClanModal,
    MemberManagementMenu,
    LeaveClanModal,
    AcceptInvitePanel,
    PendingInvitesPanel,
    InvitePlayerModal,
    ClanCreationPanel,
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const oauthStore = useOauthStore();
    const rankingsStore = useRankingStore();
    const clanStore = useClanStore();
    const playerStore = usePlayerStore();
    const router = useRouter();

    const playersClan = computed<Clan>(() => clanStore.playersClan);
    const battleTag = computed<string>(() => decodeURIComponent(props.id));
    const currentSeason = computed<number>(() => rankingsStore.seasons[0].id);
    const clanIsFunded = computed<boolean>(() => playersClan.value.isSuccesfullyFounded);
    const roleEnums = computed<typeof EClanRole>(() => EClanRole);
    const hasPendingInvite = computed<boolean>(() => !!clanStore.selectedMemberShip?.pendingInviteFromClan);
    const verifiedBtag = computed<string>(() => oauthStore.blizzardVerifiedBtag);
    const selectedPlayer = computed<string>(() => playerStore.battleTag);
    const hasNoClan = computed<boolean>(() => !playersClan?.value.clanId);
    const isLoggedInPlayer = computed<boolean>(() => verifiedBtag.value === selectedPlayer.value);
    const shamans = computed<string[]>(() => clanStore.playersClan.shamans);
    const members = computed<string[]>(() => clanStore.playersClan.members);
    const loggedInRole = computed<EClanRole>(() => defineRole(verifiedBtag.value));
    const loggedInPlayerIsChiefTain = computed<boolean>(() => playersClan.value.chiefTain === verifiedBtag.value);
    const loggedInPlayerIsShaman = computed<boolean>(() => !!(playersClan.value.shamans.find((s) => s === verifiedBtag.value) || loggedInPlayerIsChiefTain.value));

    function getLeagueOrder(battleTag: string): number {
      return playersClan.value.ranks
        ?.filter(
          (r) => r.season === currentSeason.value && r.gameMode === EGameMode.GM_1ON1 && r.id.includes(battleTag)
        )
        .sort((a, b) => a.leagueOrder - b.leagueOrder)[0]?.leagueOrder;
    }

    function goToPlayer(battleTag: string): void {
      router.push({ path: getProfileUrl(battleTag) });
    }

    function defineRole(member: string): EClanRole {
      if (member === playersClan.value.chiefTain) return EClanRole.ChiefTain;
      if (playersClan.value.shamans.find((s) => s === member)) return EClanRole.Shaman;
      return EClanRole.Member;
    }

    onMounted(async (): Promise<void> => {
      await rankingsStore.retrieveSeasons();

      await playerStore.loadProfile({
        battleTag: battleTag.value,
        freshLogin: false,
      });

      await clanStore.retrievePlayersMembership();
      await clanStore.retrievePlayersClan();
    });

    function getStats(mode: EGameMode): ModeStat {
      const modeRankings = playersClan.value.ranks?.filter((r) => r.gameMode === mode && r.leagueName != null);
      const players = modeRankings.map((rankings) => rankings.player);
      if (players.length === 0) return { games: 0, gameMode: mode } as ModeStat;

      const reduced = players.reduce(
        (a, b) => ({
          wins: a.wins + b.wins,
          losses: a.losses + b.losses,
          gameMode: mode,
          games: a.games + b.games,
          rank: 0,
          leagueOrder: 0,
        }),
        {
          wins: 0,
          losses: 0,
          gameMode: mode,
          games: 0,
          rank: 0,
          leagueOrder: 0,
        }
      );

      const allRanks = playersClan.value.ranks.filter((r) => r.rankNumber != 0 && r.gameMode === mode);
      const order = allRanks.reduce((a, b) => ({ leagueOrder: a.leagueOrder + b.leagueOrder }), { leagueOrder: 0 });
      reduced.leagueOrder = Math.round(order.leagueOrder / allRanks.length);
      reduced.rank = allRanks.reduce((a, b) => a + b.rankNumber, 0);

      return reduced as ModeStat;
    }

    return {
      EGameMode,
      hasNoClan,
      isLoggedInPlayer,
      hasPendingInvite,
      playersClan,
      loggedInPlayerIsShaman,
      clanIsFunded,
      getStats,
      goToPlayer,
      roleEnums,
      getLeagueOrder,
      shamans,
      loggedInPlayerIsChiefTain,
      defineRole,
      loggedInRole,
      members,
      battleTagToName
    };
  },
});
</script>
