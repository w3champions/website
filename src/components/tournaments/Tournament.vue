<template>
  <div v-if="tournament">
    <v-card-title>
      {{tournament.name}}
    </v-card-title>
    <div class="pl-4 pb-4">
      <tournament-description :tournament="tournament" />
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

@Component({
  components: {
    TournamentDescription,
    TournamentBracket,
  },
})
export default class Tournament extends Vue {
  @Prop() public tournament!: ITournament;
}
</script>
