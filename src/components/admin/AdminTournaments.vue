<template>
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
          :maps="activeMaps"
          @cancel="closeCreateTournament"
          @save="createTournament"
        />
      </v-dialog>
      <v-dialog v-if="isEditTournamentOpen" v-model="isEditTournamentOpen" max-width="1000px">
        <edit-tournament-modal
          :tournament="tournament"
          :saving="isLoading"
          :maps="activeMaps"
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
</template>

<script lang="ts">
import Vue from "vue";
import throttle from "lodash/throttle";
import { Component } from "vue-property-decorator";
import { ITournament, ITournamentPlayer, ETournamentState } from "@/store/tournaments/types";
import Tournament from "../tournaments/Tournament.vue";
import AddPlayerModal from "./tournaments/AddPlayerModal.vue";
import RemovePlayerModal from "./tournaments/RemovePlayerModal.vue";
import EditTournamentModal from "./tournaments/EditTournamentModal.vue";
import { ERaceEnum } from "@/store/types";
import { Map } from "@/store/admin/mapsManagement/types";
import { useTournamentsStore } from "@/store/tournaments/store";
import { useTournamentsManagementStore } from "@/store/admin/tournamentsManagement/store";

@Component({
  components: {
    Tournament,
    AddPlayerModal,
    RemovePlayerModal,
    EditTournamentModal,
  },
})
export default class AdminTournaments extends Vue {
  public isAddPlayerOpen = false;
  public isRemovePlayerOpen = false;
  public isCreateTournamentOpen = false;
  public isEditTournamentOpen = false;

  private throttledInit = throttle(this.init, 2000, { leading: true });
  private tournamentsStore = useTournamentsStore();
  private tournamentsManagementStore = useTournamentsManagementStore();
  _intervalRefreshHandle?: number = undefined;

  async mounted(): Promise<void> {
    this.throttledInit();
    await this.tournamentsStore.loadActiveTournamentMaps();
    this._intervalRefreshHandle = setInterval(() => {
      this.throttledInit();
    }, 15000);
  }

  private async init(): Promise<void> {
    await this.tournamentsManagementStore.loadUpcomingTournament();
  }

  get activeMaps(): Map[] {
    return this.tournamentsStore.activeMaps;
  }

  get isLoading() {
    return this.tournamentsManagementStore.isLoading;
  }

  get tournament(): ITournament {
    return this.tournamentsManagementStore.upcomingTournament;
  }

  public openAddPlayer() {
    this.isAddPlayerOpen = true;
  }

  public closeAddPlayer() {
    this.isAddPlayerOpen = false;
  }

  public async addPlayer(battleTag: string, race: ERaceEnum) {
    try {
      const player = {
        battleTag,
        race,
      } as ITournamentPlayer;
      const added = await this.tournamentsManagementStore.registerPlayer(player);

      if (added) {
        this.isAddPlayerOpen = false;
      }
    } catch {
      alert("Error while adding player");
    }
    this.throttledInit();
  }

  public openRemovePlayer() {
    this.isRemovePlayerOpen = true;
  }

  public closeRemovePlayer() {
    this.isRemovePlayerOpen = false;
  }

  public async removePlayer(battleTag: string) {
    try {
      const removed = await this.tournamentsManagementStore.unregisterPlayer(battleTag);

      if (removed) {
        this.isRemovePlayerOpen = false;
      }
    } catch {
      alert("Error while removing player");
    }
    this.throttledInit();
  }

  get registrationOpen() {
    return this.tournament.state === ETournamentState.INIT ||
           this.tournament.state === ETournamentState.REGISTRATION;
  }

  public openCreateTournament() {
    this.isCreateTournamentOpen = true;
  }

  public closeCreateTournament() {
    this.isCreateTournamentOpen = false;
  }

  public async createTournament(tournamentData: ITournament) {
    const created = await this.tournamentsManagementStore.createTournament(tournamentData);
    if (created) {
      this.closeCreateTournament();
      this.throttledInit();
    }
  }

  public openEditTournament() {
    this.isEditTournamentOpen = true;
  }

  public closeEditTournament() {
    this.isEditTournamentOpen = false;
  }

  public async updateTournament(tournamentData: ITournament) {
    tournamentData.id = this.tournament.id;
    const updated = await this.tournamentsManagementStore.updateTournament(tournamentData);
    if (updated) {
      this.closeEditTournament();
      this.throttledInit();
    }
  }

  destroyed(): void {
    clearInterval(this._intervalRefreshHandle);
  }
}
</script>

<style lang="scss"></style>
