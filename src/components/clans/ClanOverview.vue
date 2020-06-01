<template>
  <v-card-text>
    <div v-if="hasNoClan && !isLoggedInPlayer">
      <v-row class="justify-center">
        <v-col class="text-center">
          <v-card-subtitle>
            This player is not part of a clan
          </v-card-subtitle>
        </v-col>
      </v-row>
    </div>
    <div v-if="hasNoClan && isLoggedInPlayer">
      <clan-creation-panel />
    </div>
    <div v-if="!hasNoClan">
      <v-card-title class="justify-space-between">
        <span>{{ playersClan.clanName }}</span>
        <div v-if="loggedInPlayerIsChiefTain">
          <v-dialog v-model="invitePlayerDialog" persistent max-width="600px">
            <template v-slot:activator="{ on }">
              <v-btn
                @click="invitePlayerDialog = true"
                class="ma-0"
                outlined
                v-on="on"
                color="primary"
              >
                <v-icon left>mdi-pencil</v-icon>
                <span>Invite Player</span>
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">Invite Player</span>
              </v-card-title>
              <v-card-text>
                <v-autocomplete
                  v-model="searchModel"
                  append-icon="mdi-magnify"
                  label="Search"
                  single-line
                  clearable
                  :items="searchPlayers"
                  :search-input.sync="search"
                  :no-data-text="noDataText"
                  item-text="name"
                  item-value="id"
                  placeholder="Start typing to Search"
                  return-object
                >
                  <template v-slot:item="data">
                    <template v-if="typeof data.item !== 'object'">
                      <v-list-item-content
                        v-text="data.item"
                      ></v-list-item-content>
                    </template>
                    <template v-else>
                      <v-list-item-content>
                        <v-list-item-title>
                          <span v-if="!isDuplicateName(data.item.name)">
                            {{ data.item.name }}
                          </span>
                          <span v-if="isDuplicateName(data.item.name)">
                            {{ data.item.battleTag }}
                          </span>
                        </v-list-item-title>
                      </v-list-item-content>
                    </template>
                  </template>
                </v-autocomplete>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="closeDialog">
                  Close
                </v-btn>
                <v-btn
                  color="blue darken-1"
                  text
                  :disabled="!searchModel"
                  @click="invitePlayer"
                >
                  Invite
                </v-btn>
              </v-card-actions>
              <v-alert
                v-model="isValidationError"
                type="warning"
                dense
                class="ml-4 mr-4"
                dismissible
              >
                {{ clanValidationError }}
              </v-alert>
            </v-card>
          </v-dialog>
        </div>
      </v-card-title>
      <v-card-subtitle
        class="pointer"
        @click="gotToChiefTain"
        v-if="playersClan.isSuccesfullyFounded"
      >
        Chieftain: {{ playersClan.chiefTain.split("#")[0] }}
      </v-card-subtitle>
      <v-card-subtitle v-if="!playersClan.isSuccesfullyFounded">
        This clan is not founded yet
      </v-card-subtitle>
      <div v-if="playersClan.isSuccesfullyFounded">
        <v-card-title>
          Members:
        </v-card-title>
        <v-list>
          <v-list-item
            class="pointer"
            @click="goToPlayer(member)"
            v-for="member in playersClan.members"
            :key="member"
          >
            {{ member.split("#")[0] }}
          </v-list-item>
        </v-list>
      </div>

      <div v-if="!playersClan.isSuccesfullyFounded">
        <v-card-title>
          Signees:
        </v-card-title>
        <table class="custom-table">
          <tr
            v-for="member in playersClan.foundingFathers"
            :key="member"
            @click="goToPlayer(member)"
          >
            <td>
              <span class="pointer" @click="goToPlayer(member)">{{ member.split("#")[0] }}</span>
            </td>
          </tr>
        </table>
        <div v-if="loggedInPlayerIsChiefTain">
          <v-card-title>
            Invites Pending:
          </v-card-title>
          <v-card-subtitle v-if="hasNoPendingInvites">
            None pending
          </v-card-subtitle>
          <table class="custom-table" v-if="!hasNoPendingInvites">
            <tr
                    v-for="member in playersClan.pendingInvites"
                    :key="member"
            >
              <td>
                <v-row class="justify-space-between align-center ma-0">
                  <v-col class="pa-0">
                    <span class="pointer" @click="goToPlayer(member)">{{ member.split("#")[0] }}</span>
                  </v-col>
                  <v-col class="text-right pa-0">
                    <v-btn @click="revokeInvite(member)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop, Watch } from "vue-property-decorator";
import HeroPicture from "@/components/match-details/HeroPicture.vue";
import { PlayerProfile } from "@/store/player/types";
import ClanCreationPanel from "@/components/clans/ClanCreationPanel.vue";

@Component({
  components: { ClanCreationPanel, HeroPicture },
})
export default class ClanOverview extends Vue {
  public searchModel = {} as PlayerProfile;

  public clanNameToCreate = "";
  public search = "";
  public invitePlayerDialog = false;
  public isValidationError = false;

  public isDuplicateName(name: string) {
    return this.searchPlayers.filter((r) => r.name === name).length > 1;
  }

  get noDataText(): string {
    if (!this.search || this.search.length < 3) {
      return "Type at lease 3 letters";
    }

    return "No player found";
  }

  public async invitePlayer() {
    await this.$store.direct.dispatch.clan.invitePlayer(
      this.searchModel.battleTag
    );
    if (this.$store.direct.state.clan.clanValidationError) {
      this.isValidationError = true;
    } else {
      await this.$store.direct.dispatch.clan.retrievePlayersClan();
      this.search = "";
      this.invitePlayerDialog = false;
    }
  }

  public closeDialog() {
    this.invitePlayerDialog = false;
    this.isValidationError = false;
    this.search = "";
  }

  @Watch("search")
  public onSearchChanged(newValue: string) {
    if (newValue && newValue.length > 2) {
      this.$store.direct.dispatch.clan.searchPlayers(newValue.toLowerCase());
    } else {
      this.$store.direct.commit.clan.SET_PLAYERS_SEARCH([]);
      this.isValidationError = false;
    }
  }

  public async revokeInvite(member: string) {
    await this.$store.direct.dispatch.clan.revokeInvite(member);
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }

  public changeInsertedClanName(newName: string) {
    this.clanNameToCreate = newName;
  }

  get clanValidationError() {
    return this.$store.direct.state.clan.clanValidationError;
  }

  get hasNoPendingInvites() {
    return this.playersClan?.pendingInvites?.length === 0;
  }

  get searchPlayers() {
    return this.$store.direct.state.clan.searchPlayers;
  }

  public gotToChiefTain() {
    this.goToPlayer(this.playersClan.chiefTain);
  }

  get loggedInPlayerIsChiefTain() {
    return (
      this.playersClan.chiefTain ===
      this.verifiedBtag
    );
  }

  public goToPlayer(battleTag: string) {
    this.$router.push({ path: "/player/" + encodeURIComponent(battleTag) });
  }

  get verifiedBtag() {
    return this.$store.direct.state.oauth.blizzardVerifiedBtag
  }

  get hasNoClan() {
    return !this.playersClan?.id;
  }

  get isLoggedInPlayer() {
    return this.verifiedBtag === this.selectedPlayer;
  }

  get selectedPlayer() {
    return this.$store.direct.state.player.battleTag
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }

  async mounted() {
    await this.$store.direct.dispatch.clan.retrievePlayersClan();
  }
}
</script>
