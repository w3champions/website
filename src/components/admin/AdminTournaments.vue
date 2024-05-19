<template>
  <div>
    <v-card-title>
      Manage Tournaments
    </v-card-title>
    <v-container>
      <v-card class="pa-md-4">
        <v-dialog v-if="isAddPlayerOpen" v-model="isAddPlayerOpen" max-width="800px">
          <add-player-modal
            :tournament="tournament"
            :saving="isLoading"
            @cancel="closeAddPlayer"
            @save="addPlayer"
          />
        </v-dialog>
        <v-dialog v-if="isRemovePlayerOpen" v-model="isRemovePlayerOpen" max-width="800px">
          <remove-player-modal
            :tournament="tournament"
            :saving="isLoading"
            @cancel="closeRemovePlayer"
            @save="removePlayer"
          />
        </v-dialog>
        <v-dialog v-if="isCreateTournamentOpen" v-model="isCreateTournamentOpen" max-width="1000px">
          <edit-tournament-modal
            :saving="isLoading"
            :maps="tournamentMaps"
            @cancel="closeCreateTournament"
            @save="createTournament"
          />
        </v-dialog>
        <v-dialog v-if="isEditTournamentOpen" v-model="isEditTournamentOpen" max-width="1000px">
          <edit-tournament-modal
            :tournament="tournament"
            :saving="isLoading"
            :maps="tournamentMaps"
            @cancel="closeEditTournament"
            @save="updateTournament"
          />
        </v-dialog>

        <v-row>
          <v-col>
            <h3 class="mt-2">Next Scheduled Tournament</h3>
          </v-col>
          <v-col class="d-flex justify-end">
            <div v-if="tournament.id">
              <v-btn v-if="registrationOpen" color="primary" class="mb-2 mr-2 w3-race-bg--text" @click="openAddPlayer">Add Player</v-btn>
              <v-btn v-if="registrationOpen" color="primary" class="mb-2 mr-2 w3-race-bg--text" @click="openRemovePlayer">Remove Player</v-btn>
              <v-btn color="primary" class="mb-2 mr-2 w3-race-bg--text" @click="openEditTournament">Edit</v-btn>
            </div>
            <v-btn v-else color="primary" class="mb-2 w3-race-bg--text" @click="openCreateTournament">Create Tournament</v-btn>
          </v-col>
        </v-row>

        <div v-if="tournament.id">
          <Tournament :tournament="tournament" />
        </div>
        <div v-else>
          No upcoming tournament.
        </div>
      </v-card>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, onUnmounted, ref } from "vue";
import throttle from "lodash/throttle";
import { ITournament, ITournamentPlayer, ETournamentState } from "@/store/tournaments/types";
import Tournament from "../tournaments/Tournament.vue";
import AddPlayerModal from "./tournaments/AddPlayerModal.vue";
import RemovePlayerModal from "./tournaments/RemovePlayerModal.vue";
import EditTournamentModal from "./tournaments/EditTournamentModal.vue";
import { ERaceEnum } from "@/store/types";
import { Map } from "@/store/admin/mapsManagement/types";
import { useTournamentsStore } from "@/store/tournaments/store";
import { useTournamentsManagementStore } from "@/store/admin/tournamentsManagement/store";

export default defineComponent({
  name: "AdminTournaments",
  components: {
    Tournament,
    AddPlayerModal,
    RemovePlayerModal,
    EditTournamentModal,
  },
  props: {},
  setup() {
    const tournamentsStore = useTournamentsStore();
    const tournamentsManagementStore = useTournamentsManagementStore();

    const throttledInit = throttle(init, 2000, { leading: true });
    let _intervalRefreshHandle: NodeJS.Timeout;

    const isAddPlayerOpen = ref<boolean>(false);
    const isRemovePlayerOpen = ref<boolean>(false);
    const isCreateTournamentOpen = ref<boolean>(false);
    const isEditTournamentOpen = ref<boolean>(false);

    const tournamentMaps: ComputedRef<Map[]> = computed((): Map[] => tournamentsStore.tournamentMaps);
    const isLoading: ComputedRef<boolean> = computed((): boolean => tournamentsManagementStore.isLoading);
    const tournament: ComputedRef<ITournament> = computed((): ITournament => tournamentsManagementStore.upcomingTournament);

    const registrationOpen: ComputedRef<boolean> = computed((): boolean => {
      return tournament.value.state === ETournamentState.INIT || tournament.value.state === ETournamentState.REGISTRATION;
    });

    async function init(): Promise<void> {
      await tournamentsManagementStore.loadEnabledFloNodes();
      await tournamentsManagementStore.loadUpcomingTournament();
    }

    function openAddPlayer(): void {
      isAddPlayerOpen.value = true;
    }

    function closeAddPlayer(): void {
      isAddPlayerOpen.value = false;
    }

    async function addPlayer(battleTag: string, race: ERaceEnum): Promise<void> {
      try {
        const player = {
          battleTag,
          race,
        } as ITournamentPlayer;
        const added = await tournamentsManagementStore.registerPlayer(player);

        if (added) {
          isAddPlayerOpen.value = false;
        }
      } catch {
        alert("Error while adding player");
      }
      throttledInit();
    }

    function openRemovePlayer(): void {
      isRemovePlayerOpen.value = true;
    }

    function closeRemovePlayer(): void {
      isRemovePlayerOpen.value = false;
    }

    async function removePlayer(battleTag: string): Promise<void> {
      try {
        const removed = await tournamentsManagementStore.unregisterPlayer(battleTag);

        if (removed) {
          isRemovePlayerOpen.value = false;
        }
      } catch {
        alert("Error while removing player");
      }
      throttledInit();
    }

    function openCreateTournament(): void {
      isCreateTournamentOpen.value = true;
    }

    function closeCreateTournament(): void {
      isCreateTournamentOpen.value = false;
    }

    async function createTournament(tournamentData: ITournament): Promise<void> {
      const created = await tournamentsManagementStore.createTournament(tournamentData);
      if (created) {
        closeCreateTournament();
        throttledInit();
      }
    }

    function openEditTournament(): void {
      isEditTournamentOpen.value = true;
    }

    function closeEditTournament(): void {
      isEditTournamentOpen.value = false;
    }

    async function updateTournament(tournamentData: ITournament): Promise<void> {
      tournamentData.id = tournament.value.id;
      const updated = await tournamentsManagementStore.updateTournament(tournamentData);
      if (updated) {
        closeEditTournament();
        throttledInit();
      }
    }

    onMounted(async (): Promise<void> => {
      throttledInit();
      await tournamentsStore.loadTournamentMaps();
      _intervalRefreshHandle = setInterval(() => {
        throttledInit();
      }, 15000);
    });

    onUnmounted((): void => {
      clearInterval(_intervalRefreshHandle);
    });

    return {
      isAddPlayerOpen,
      tournament,
      isLoading,
      closeAddPlayer,
      addPlayer,
      isRemovePlayerOpen,
      closeRemovePlayer,
      removePlayer,
      isCreateTournamentOpen,
      tournamentMaps,
      closeCreateTournament,
      createTournament,
      isEditTournamentOpen,
      closeEditTournament,
      updateTournament,
      registrationOpen,
      openAddPlayer,
      openRemovePlayer,
      openEditTournament,
      openCreateTournament,
    };
  },
});
</script>
