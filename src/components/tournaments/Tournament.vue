<template>
  <div v-if="tournament">
    <v-card-title>
      {{ tournament.name }}
    </v-card-title>
    <div class="pl-4 pb-4">
      <tournament-description :tournament="tournament" :maps="maps" />
      <tournament-bracket :tournament="tournament" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { ITournament } from "@/store/tournaments/types";
import TournamentDescription from "@/components/tournaments/TournamentDescription.vue";
import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";
import { Map } from "@/store/admin/maps/types";
import { useTournamentsStore } from "@/store/tournaments/store";

@Component({
  components: {
    TournamentDescription,
    TournamentBracket,
  },
})
export default class Tournament extends Vue {
  @Prop() public tournament!: ITournament;
  private tournamentsStore = useTournamentsStore();

  async mounted(): Promise<void> {
    await this.tournamentsStore.loadTournamentMaps();
  }

  get maps(): Map[] {
    return this.tournamentsStore.maps;
  }
}
</script>
