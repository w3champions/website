<template>
  <v-container>
    <v-card class="mt-2" :v-if="tournament">
      <v-card-title>
        {{tournament.name}}
      </v-card-title>
      <div class="pl-4">
        <tournament-description tournament="tournament" />
        <tournament-bracket tournament="tournament" />
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import TournamentDescription from "@/components/tournaments/TournamentDescription.vue";
import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";

@Component({
  components: {
    TournamentDescription,
    TournamentBracket,
  },
})

export default class TournamentDetail extends Vue {
  @Prop() public tournamentId!: string;

  get tournament(): ITournament | undefined {
    return this.$store.direct.state.tournaments.tournaments.find(t => t.id === this.tournamentId);
  }
}
</script>
