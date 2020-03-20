<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
          <v-row>
                <v-col cols="5.5">
                  <player-match-info :player="selfPlayer" left="true"></player-match-info>
                </v-col>
                <v-col cols="1">
                    VS
                </v-col>
                <v-col cols="5.5">
                  <player-match-info :player="otherPlayer"></player-match-info>
                </v-col>
              </v-row>
      </v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { PlayerProfile } from "../store/player/types";
import { Match, ERaceEnum, MatchPlayer } from "../store/typings";
import PlayerMatchInfo from "./PlayerMatchInfo.vue";

@Component({
  components: {
    PlayerMatchInfo
  }
})
export default class PlayerView extends Vue {
  @Prop() public match!: Match;
  @Prop() public selfBattleTag!: string;

  get selfPlayer(): MatchPlayer {
    const player = this.match.players.filter(
      x => x.battleTag.toLowerCase() === this.selfBattleTag.toLowerCase()
    );

    if (player && player.length > 0) {
      return player[0];
    }

    return {} as MatchPlayer;
  }

  get otherPlayer(): MatchPlayer {
    const player = this.match.players.filter(
      x => x.battleTag.toLowerCase() !== this.selfBattleTag.toLowerCase()
    );

    if (player && player.length > 0) {
      return player[0];
    }

    return {} as MatchPlayer;
  }

  get won(): string {
    if (Object.prototype.hasOwnProperty.call(this.selfPlayer, "won")) {
      return this.selfPlayer.won ? "won" : "lost";
    }

    return "";
  }
}
</script>