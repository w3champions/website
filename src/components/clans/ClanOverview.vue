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
    <clan-creation-panel
      v-if="!hasPendingInvite && hasNoClan && isLoggedInPlayer"
    />
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
            modeEnums.GM_1ON1,
            modeEnums.GM_2ON2,
            modeEnums.GM_2ON2_AT,
            modeEnums.GM_4ON4,
            modeEnums.GM_FFA,
          ]"
          :key="mode"
        >
          <player-league
            :small-mode="true"
            :show-performance="false"
            :mode-stat="getStats(mode)"
          />
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
                  <span class="pointer" @click="goToPlayer(playersClan.chiefTain)">
                    {{ playersClan.chiefTain.split("#")[0] }}
                  </span>
                  <v-tooltip top :disabled="!getLeagueOrder(playersClan.chiefTain)">
                    <template v-slot:activator="{ on }">
                      <div v-on="on" style="display: inline">
                        <league-icon
                          v-on="on"
                          class="ml-4 mb-1"
                          :league="getLeagueOrder(playersClan.chiefTain)"
                        />
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
                  <span class="pointer" @click="goToPlayer(shaman)">
                    {{ shaman.split("#")[0] }}
                  </span>
                  <v-tooltip top :disabled="!getLeagueOrder(shaman)">
                    <template v-slot:activator="{ on }">
                      <div v-on="on" style="display: inline">
                        <league-icon
                          v-on="on"
                          class="ml-4 mb-1"
                          :league="getLeagueOrder(shaman)"
                        />
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
                  <span class="pointer" @click="goToPlayer(member)">
                    {{ member.split("#")[0] }}
                  </span>
                  <v-tooltip top :disabled="!getLeagueOrder(member)">
                    <template v-slot:activator="{ on }">
                      <div v-on="on" style="display: inline">
                        <league-icon
                          v-on="on"
                          class="ml-4 mb-1"
                          :league="getLeagueOrder(member)"
                        />
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
          {{ $t("components_clans_clanoverview.signeecounter") }} ({{playersClan.foundingFathers.length}} / 2):
        </v-card-title>
        <table class="custom-table">
          <tr v-for="member in playersClan.foundingFathers" :key="member">
            <td>
              <span class="pointer" @click="goToPlayer(member)">{{ member.split("#")[0] }}</span>
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
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
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
import PlayerAvatar from "@/components/player/PlayerAvatar.vue";
import ClanRoleIcon from "@/components/clans/ClanRoleIcon.vue";
import PlayerLeague from "@/components/player/PlayerLeague.vue";
import { ModeStat, PlayerProfile } from "@/store/player/types";
import { getProfileUrl } from "@/helpers/url-functions";
import { useOauthStore } from "@/store/oauth/store";
import { useRankingStore } from "@/store/ranking/store";
import { usePlayerStore } from "@/store/player/store";
import { useClanStore } from "@/store/clan/store";

@Component({
  components: {
    PlayerLeague,
    ClanRoleIcon,
    PlayerAvatar,
    LeagueIcon,
    DeleteClanModal,
    MemberManagementMenu,
    LeaveClanModal,
    AcceptInvitePanel,
    PendingInvitesPanel,
    InvitePlayerModal,
    ClanCreationPanel,
  },
})
export default class ClanOverview extends Vue {
  private oauthStore = useOauthStore();
  private rankingsStore = useRankingStore();
  private player = usePlayerStore();
  @Prop() public id!: string;
  private clanStore = useClanStore();

  public modeEnums = Object.freeze(EGameMode);

  get battleTag(): string {
    return decodeURIComponent(this.id);
  }

  get currentSeason(): number {
    return this.rankingsStore.seasons[0].id;
  }

  public getLeagueOrder(battleTag: string): number {
    return this.playersClan.ranks
      ?.filter(
        (r) =>
          r.season === this.currentSeason &&
          r.gameMode === EGameMode.GM_1ON1 &&
          r.id.includes(battleTag)
      )
      .sort((a, b) => a.leagueOrder - b.leagueOrder)[0]?.leagueOrder;
  }

  public getStats(mode: EGameMode): { wins: number; losses: number; gameMode: EGameMode; games: number; rank: number; leagueOrder: number } {
    const modeRankings = this.playersClan.ranks?.filter(
      (r) => r.gameMode === mode && r.leagueName != null
    );
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

    const allRanks = this.playersClan.ranks.filter(
      (r) => r.rankNumber != 0 && r.gameMode === mode
    );
    const order = allRanks.reduce(
      (a, b) => ({ leagueOrder: a.leagueOrder + b.leagueOrder }),
      { leagueOrder: 0 }
    );
    reduced.leagueOrder = Math.round(order.leagueOrder / allRanks.length);
    reduced.rank = allRanks.reduce((a, b) => a + b.rankNumber, 0);

    return reduced;
  }

  get clanIsFunded(): boolean {
    return this.playersClan.isSuccesfullyFounded;
  }

  get roleEnums(): typeof EClanRole {
    return EClanRole;
  }

  get clanValidationError(): string {
    return this.clanStore.clanValidationError;
  }

  get hasPendingInvite(): boolean {
    return !!this.clanStore.selectedMemberShip
      ?.pendingInviteFromClan;
  }

  get searchPlayers(): PlayerProfile[] {
    return this.clanStore.searchPlayers;
  }

  public defineRole(member: string): EClanRole {
    if (member === this.playersClan.chiefTain) return EClanRole.ChiefTain;
    if (this.playersClan.shamans.find((s) => s === member))
      return EClanRole.Shaman;
    return EClanRole.Member;
  }

  get loggedInRole(): EClanRole {
    return this.defineRole(this.verifiedBtag);
  }

  get loggedInPlayerIsChiefTain(): boolean {
    return this.playersClan.chiefTain === this.verifiedBtag;
  }

  get loggedInPlayerIsShaman(): boolean {
    return !!(
      this.playersClan.shamans.find((s) => s === this.verifiedBtag) ||
      this.loggedInPlayerIsChiefTain
    );
  }

  public goToPlayer(battleTag: string): void {
    this.$router.push({ path: getProfileUrl(battleTag) });
  }

  get verifiedBtag(): string {
    return this.oauthStore.blizzardVerifiedBtag;
  }

  get hasNoClan(): boolean {
    return !this.playersClan?.clanId;
  }

  get isLoggedInPlayer(): boolean {
    return this.verifiedBtag === this.selectedPlayer;
  }

  get selectedPlayer(): string {
    return this.player.battleTag;
  }

  get playersClan(): Clan {
    return this.clanStore.playersClan;
  }

  get shamans(): string[] {
    return this.clanStore.playersClan.shamans;
  }

  get members(): string[] {
    return this.clanStore.playersClan.members;
  }

  async mounted(): Promise<void> {
    await this.rankingsStore.retrieveSeasons();

    await this.player.loadProfile({
      battleTag: this.battleTag,
      freshLogin: false,
    });
  }

  // Load clans on activate instead of mount,
  // because component is already mounted when going from a profile to another profile, leading to wrong clan being displayed
  async activated(): Promise<void> {
    this.player.SET_BATTLE_TAG(this.battleTag);
    await this.clanStore.retrievePlayersMembership();
    await this.clanStore.retrievePlayersClan();
  }
}
</script>
