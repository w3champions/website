<template>
  <v-container>
    <v-card class="mt-2 pb-2 pr-4">
      <v-card-title>Tournaments</v-card-title>
      <v-card-text>
        <div class="mb-4">
          <h3>Upcoming</h3>
          <tournaments-table :tournaments="upcomingTournaments" @click:row="onRowClick" />
        </div>
        <div>
          <h3>Past</h3>
          <tournaments-table :tournaments="tournaments" @click:row="onRowClick" />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted } from "vue";
import difference from "lodash/difference";
import { isFuture } from "date-fns";
import TournamentsTable from "@/components/tournaments/TournamentsTable.vue";
import { ITournament } from "@/store/tournaments/types";
import { getTournamentUrl } from "@/helpers/url-functions";
import { ETournamentState } from "@/store/tournaments/types";
import { useTournamentsStore } from "@/store/tournaments/store";
import { useRouter } from "vue-router/composables";

export default defineComponent({
  name: "TournamentsView",
  components: {
    TournamentsTable,
  },
  props: {},
  setup() {
    const router = useRouter();
    const tournamentsStore = useTournamentsStore();

    const tournaments: ComputedRef<ITournament[]> = computed((): ITournament[] => tournamentsStore.tournaments);
    const pastTournaments: ComputedRef<ITournament[]> = computed((): ITournament[] => difference(tournaments.value, upcomingTournaments.value));

    const upcomingTournaments: ComputedRef<ITournament[]> = computed((): ITournament[] => {
      return tournaments.value.filter((tournament) => (
        [ETournamentState.INIT, ETournamentState.REGISTRATION].includes(tournament.state)
        && isFuture(tournament.startDateTime)
      ));
    });

    function onRowClick(item: ITournament) {
      router.push({
        path: getTournamentUrl(item.id),
      });
    }
    onMounted(async (): Promise<void> => {
      await tournamentsStore.retrieveTournaments();
    });

    return {
      upcomingTournaments,
      tournaments,
      onRowClick,
    };
  },
});
</script>
