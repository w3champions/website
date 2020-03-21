<template>
  <div :class="textClass">
    <div>
      <v-tooltip top>
      <template v-slot:activator="{ on }">
        <a v-on="on" @mouseover="lazyLoadProfile" @click="goToPlayer(name)">{{name}} (<v-icon style="font-size: 16px;">mdi-chevron-triple-up</v-icon>{{mmr}})</a>
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
    <div :class="won" >
      <span v-if="won">{{won}}</span>
      <img :src="getRacePicture(player.race)" />
      <span v-if="player.xpChange" :class="won">| <span v-if="player.xpChange > 0">+</span>{{player.xpChange}} XP</span>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ERaceEnum } from "@/store/typings";

@Component({})
export default class PlayerMatchInfo extends Vue {
  @Prop() public player!: {
    battleTag: string;
    race: ERaceEnum;
    bucket: number;
    won?: boolean;
    xpChange?: number;
  };

  @Prop() public left!: boolean;
  public raceEnum = ERaceEnum;

  getRacePicture(race: ERaceEnum) {
    const images = require.context("../assets/raceIcons");
    return images("./" + this.raceEnum[race] + ".jpg");
  }

  get won() {
    if (Object.prototype.hasOwnProperty.call(this.player, 'won')) {
      return this.player.won ? 'won' : 'lost';
    }

    return '';
  }

  get color() {
    if (this.won === 'won') {
      return "green";
    }

    if (this.won === 'lost') {
      return "red";
    }

    return 'gray';
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

  public profile = {} as any;

  private async lazyLoadProfile() {
    if (!this.profile.account) {
      this.profile = await this.$store.direct.getters.profileService.retrieveRawProfile(this.name);
    }
  }

  public goToPlayer(playerName: string) {
    const parts = playerName.split("#");

    this.$router.push({
      path: "/player/" + parts[0] + "/" + parts[1]
    }).catch(err => {
      return;
    });
  }
}
</script>
