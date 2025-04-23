<template>
  <v-menu offset-x>
    <template #activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">{{ mdiTrophy }}</v-icon> {{ selectedTournamentText }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("components_tournaments_tournamentselect.selecttourney") }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider />
        <v-list dense max-height="400" class="overflow-y-auto">
          <v-list-item
            v-for="tournament in tournaments"
            :key="tournament.id"
            @click="selectTournament(tournament)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ tournament.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from "vue";
import { ITournament } from "@/store/tournaments/types";
import { mdiTrophy } from "@mdi/js";

export default defineComponent({
  name: "TournamentSelect",
  components: {},
  props: {
    tournaments: {
      type: Array<ITournament>,
      required: true,
    },
    selectedTournament: {
      type: Object as PropType<ITournament>,
      required: true,
    },
  },
  setup(props, context) {
    const selectedTournamentText = computed<string>(() => props.selectedTournament ? props.selectedTournament.name : "Select tournament");

    function selectTournament(tournament: ITournament) {
      context.emit("tournamentSelected", tournament);
    }

    return {
      mdiTrophy,
      selectedTournamentText,
      selectTournament,
    };
  },
});
</script>
