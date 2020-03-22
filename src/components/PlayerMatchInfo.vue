<template>
  <div :class="textClass">
    <player-icon :left="left" :race="player.race" :mmr="mmr" />
    <div>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <a
            :class="won"
            v-on="on"
            @mouseover="lazyLoadProfile"
            @click="goToPlayer(name)"
          >
            {{ nameWithoutBtag }}
            <span v-if="player.xpChange" :class="won">
              <span v-if="player.xpChange > 0"> (+{{ player.xpChange }})</span>
              <span v-else> ({{ player.xpChange }})</span>
            </span>
            <br />
            <span class="btag">#{{ btag }}</span>
          </a>
        </template>
        <div v-if="profile.data">
          Wins: {{ profile.data.stats.total.wins }} | Losses:
          {{ profile.data.stats.total.losses }} | Total:
          {{ profile.data.stats.total.wins + profile.data.stats.total.losses }}
        </div>
        <div v-else>
          Wins: ... | Losses: ... | Total: ...
        </div>
      </v-tooltip>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";
import PlayerIcon from "@/components/PlayerIcon.vue";

@Component({
  components: {PlayerIcon}
})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: {
    battleTag: string;
    race: ERaceEnum;
    bucket: number;
    won?: boolean;
    xpChange?: number;
  };

  @Prop() public left!: boolean;

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, "won")) {
      return this.player.won ? "won" : "lost";
    }

    return "";
  }

  get mmr() {
    return this.player.bucket;
  }

  get textClass() {
    return this.left ? "text-end" : "text-start";
  }

  get name() {
    return this.player.battleTag;
  }

  get nameWithoutBtag() {
    return this.name.split("#")[0];
  }

  get btag() {
    return this.name.split("#")[1];
  }

  public profile = {} as any;

  private async lazyLoadProfile() {
    if (!this.profile.account) {
      this.profile = await this.$store.direct.getters.profileService.retrieveRawProfile(
        this.name
      );
    }
  }

  public goToPlayer(playerName: string) {
    const parts = playerName.split("#");

    this.$router
      .push({
        path: "/player/" + parts[0] + "/" + parts[1]
      })
      .catch(err => {
        return;
      });
  }
}
</script>

<style lang="scss">
.btag {
  font-size: 10px;
}
.won {
  color: green !important;
}

.lost {
  color: red !important;
}
</style>
