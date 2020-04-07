<template>
  <v-list-item>
    <v-list-item-content>
      <v-list-item-title>
        <v-row>
          <v-col cols="5.5">
            <player-match-info :player="selfPlayer" left="true" />
          </v-col>
          <v-col cols="1">
            VS
          </v-col>
          <v-col cols="5.5">
            <player-match-info :player="otherPlayer" />
          </v-col>
        </v-row>
      </v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Match, PlayerInTeam } from "@/store/typings";
import PlayerMatchInfo from "./PlayerMatchInfo.vue";

@Component({
  components: {
    PlayerMatchInfo
  }
})
export default class PlayerView extends Vue {
  @Prop() public match!: Match;
  @Prop() public selfBattleTag!: string;

  get selfPlayer(): PlayerInTeam {
    const playersOfMatch = this.match.teams.map(m => m.players).flat();
    const player = playersOfMatch.filter(
      x => x.battleTag.toLowerCase() === this.selfBattleTag.toLowerCase()
    );

    if (player && player.length > 0) {
      return player[0];
    }

    return {} as PlayerInTeam;
  }

  get otherPlayer(): PlayerInTeam {
    const playersOfMatch = this.match.teams.map(m => m.players).flat();
    const player = playersOfMatch.filter(
      x => x.battleTag.toLowerCase() !== this.selfBattleTag.toLowerCase()
    );

    if (player && player.length > 0) {
      return player[0];
    }

    return {} as PlayerInTeam;
  }
}
</script>
