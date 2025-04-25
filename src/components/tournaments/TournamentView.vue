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
import { computed, PropType, defineComponent, onMounted } from "vue";
import { ITournament } from "@/store/tournaments/types";
import TournamentDescription from "@/components/tournaments/TournamentDescription.vue";
import TournamentBracket from "@/components/tournaments/TournamentBracket.vue";
import { Map } from "@/store/admin/mapsManagement/types";
import { useTournamentsStore } from "@/store/tournaments/store";

export default defineComponent({
  name: "TournamentView",
  components: {
    TournamentDescription,
    TournamentBracket,
  },
  props: {
    tournament: {
      type: Object as PropType<ITournament>,
      required: true,
    },
  },
  setup() {
    const tournamentsStore = useTournamentsStore();
    const maps = computed<Map[]>(() => tournamentsStore.tournamentMaps);

    onMounted(async (): Promise<void> => {
      await tournamentsStore.loadTournamentMaps();
    });

    return {
      maps,
    };
  },
});
</script>
