<template>
  <v-container>
    <v-card class="pa-md-4">
      <div v-if="tournament">
        <tournament-view :tournament="tournament" />
      </div>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from "vue";
import { ITournament } from "@/store/tournaments/types";
import TournamentView from "@/components/tournaments/TournamentView.vue";
import { useTournamentsStore } from "@/store/tournaments/store";

export default defineComponent({
  name: "TournamentDetail",
  components: {
    TournamentView,
  },
  props: {
    tournamentId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const tournamentsStore = useTournamentsStore();
    const tournament = computed<ITournament | undefined>(() => tournamentsStore.tournaments.find((t) => t.id === props.tournamentId));

    onMounted(async (): Promise<void> => {
      await tournamentsStore.retrieveTournaments();
    });

    return {
      tournament,
    };
  },
});
</script>
