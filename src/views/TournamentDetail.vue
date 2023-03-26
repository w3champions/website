<template>
  <v-container>
    <v-card class="pa-md-4">
      <div v-if="tournament">
        <tournament :tournament="tournament" />
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { ITournament } from "@/store/tournaments/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import Tournament from "@/components/tournaments/Tournament.vue";
import { useTournamentsStore } from "@/store/tournaments/store";

@Component({
  components: {
    Tournament,
  },
})
export default class TournamentDetail extends Vue {
  @Prop() public tournamentId!: string;
  private tournamentsStore = useTournamentsStore();

  async mounted() {
    await this.tournamentsStore.retrieveTournaments();
  }

  get tournament(): ITournament | undefined {
    return this.tournamentsStore.tournaments.find((t) => t.id === this.tournamentId);
  }
}
</script>
