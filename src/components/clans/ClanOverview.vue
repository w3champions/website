<template>
  <v-card-text>
    <div v-if="hasNoClan">
      <v-text-field
        :v-model="clanNameToCreate"
        @change="changeInsertedClanName"
        hint="enter clan name"
      />
      <v-btn @click="createClan">Create a clan!</v-btn>
    </div>
    <div v-if="!hasNoClan">
      <v-card-title>{{ playersClan.clanName }}</v-card-title>
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
        <v-list>
          <v-list-item
            class="pointer"
            @click="goToPlayer(member)"
            v-for="member in playersClan.foundingFathers"
            :key="member"
          >
            {{ member.split("#")[0] }}
          </v-list-item>
        </v-list>
        <v-card-title>
          Invites Pending:
        </v-card-title>
        <v-card-subtitle v-if="playersClan.pendingInvites.length === 0">
          None pending
        </v-card-subtitle>
        <v-list v-if="playersClan.pendingInvites.length !== 0">
          <v-list-item
            class="pointer"
            @click="goToPlayer(member)"
            v-for="member in playersClan.pendingInvites"
            :key="member"
          >
            {{ member.split("#")[0] }}
          </v-list-item>
        </v-list>
        <v-btn v-if="loggedInPlayerIsChiefTain">
          Invite Players to sign Petition
        </v-btn>
      </div>
    </div>
  </v-card-text>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import HeroPicture from "@/components/match-details/HeroPicture.vue";

@Component({
  components: { HeroPicture },
})
export default class ClanOverview extends Vue {
  @Prop() playerBattleTag!: string;

  public clanNameToCreate = "";

  public changeInsertedClanName(newName: string) {
    this.clanNameToCreate = newName;
  }

  public gotToChiefTain() {
    this.goToPlayer(this.playersClan.chiefTain);
  }

  get loggedInPlayerIsChiefTain() {
    return (
      this.playersClan.chiefTain ===
      this.$store.direct.state.oauth.blizzardVerifiedBtag
    );
  }

  public goToPlayer(battleTag: string) {
    this.$router.push({ path: "/player/" + encodeURIComponent(battleTag) });
  }

  public async createClan() {
    await this.$store.direct.dispatch.clan.createClan(this.clanNameToCreate);
    await this.$store.direct.dispatch.clan.retrievePlayersClan(
      this.playerBattleTag
    );
  }

  get hasNoClan() {
    return this.playersClan?.id === null;
  }

  get playersClan() {
    return this.$store.direct.state.clan.playersClan;
  }

  async mounted() {
    await this.$store.direct.dispatch.clan.retrievePlayersClan(
      this.playerBattleTag
    );
  }
}
</script>
