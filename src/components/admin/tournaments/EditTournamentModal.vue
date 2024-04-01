<template>
  <v-card class="edit-tournament-modal">
    <v-card-title>
      <span class="text-h5">{{ isEdit ? "Edit" : "Create" }} Tournament</span>
    </v-card-title>
    <v-card-text>
      <v-tabs v-model="tabsModel">
        <v-tabs-slider></v-tabs-slider>
        <v-tab>General</v-tab>
        <v-tab>Advanced</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tabsModel">
        <v-tab-item :transition="false">
          <v-select
            :items="gateways"
            v-model="gateway"
            item-text="name"
            item-value="id"
            label="Gateway"
            hide-details
            single-line
          />
          <v-text-field
            v-model="name"
            label="Name"
            hide-details
            single-line
          />
          <v-select
            v-if="isEdit"
            :items="states"
            v-model="state"
            item-text="name"
            item-value="id"
            label="State"
            hide-details
            single-line
            :menu-props="{ maxHeight: '400' }"
          />
          <div class="mt-5 d-flex justify-center">
            <v-date-picker
              v-model="startDate"
              landscape
            ></v-date-picker>
            <v-time-picker
              v-model="startTime"
              landscape
              format="24hr"
            ></v-time-picker>
          </div>
          <div class="mt-4">
            Map Pool
          </div>
          <v-row class="mt-0 mb-0">
            <v-col cols="4" class="py-0" v-for="map in mapOptions" v-bind:key="map.id">
              <v-checkbox
                :multiple="true"
                v-model="mapPool"
                :label="map.name"
                :value="map.id"
                :dense="true"
                hide-details
              />
            </v-col>
          </v-row>
        </v-tab-item>
        <v-tab-item :transition="false">
          <v-row class="mt-0">
            <v-col cols="4">
              <v-text-field
                v-model="registrationTimeMinutes"
                label="Registration Time (mins)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="readyTimeSeconds"
                label="Ready Time (s)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="vetoTimeSeconds"
                label="Veto Time (s)"
                hide-details
                type="number"
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="showWinnerTimeHours"
                label="Show Winner Time (hrs)"
                hide-details
                type="number"
              />
            </v-col>
            <v-col cols="8">
              <v-text-field
                v-model="matcherinoUrl"
                label="Matcherino URL"
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="3">
              <v-select
                :items="[2, 4, 8, 16, 32, 64]"
                v-model="maxPlayers"
                label="Max Players"
                outlined
              />
            </v-col>
            <v-col cols="2">
              <v-select
                :items="gameModes"
                :disabled="true"
                v-model="mode"
                item-text="name"
                item-value="id"
                label="Game Mode"
                hide-details
                single-line
              />
            </v-col>
            <v-col cols="4">
              <v-select
                :items="formats"
                :disabled="true"
                v-model="format"
                item-text="name"
                item-value="id"
                label="Format"
                hide-details
                single-line
              />
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
    <v-card-actions class="pt-0 pb-2">
      <v-spacer />
      <v-btn text @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
      <v-btn color="primary" class="w3-race-bg--text" @click="save" :disabled="saving || !formValid">
        {{ $t(`views_admin.save`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import map from "lodash/map";
import pick from "lodash/pick";
import pickBy from "lodash/pickBy";
import { ETournamentFormat, ETournamentState, ITournament } from "@/store/tournaments/types";
import { EGameMode } from "@/store/types";
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";
import { EGatewayLabel, EGameModeLabel, ETournamentFormatLabel } from "@/helpers/tournaments";
import { Gateways } from "@/store/ranking/types";
import { Map } from "@/store/admin/mapsManagement/types";
import { formatISO } from "date-fns";
import { formatTimestampString } from "@/helpers/date-functions";

@Component({})
export default class AddPlayerModal extends Vue {
  @Prop() public tournament!: ITournament;
  @Prop() public saving!: boolean;
  @Prop() public maps!: Map[];

  private now = formatISO(new Date());

  public name = "Standard One vs One Tournament";
  public gateway = Gateways.Europe;
  public startDate = this.now.substring(0, 10);
  public startTime = this.now.substring(11, 16);
  public startDateTime = new Date();
  public mode = EGameMode.GM_1ON1;
  public format = ETournamentFormat.SINGLE_ELIM;
  public mapPool: number[] = [];
  public state = ETournamentState.INIT;
  public registrationTimeMinutes = 5;
  public readyTimeSeconds = 180;
  public vetoTimeSeconds = 45;
  public showWinnerTimeHours = 24;
  public matcherinoUrl = "";
  public maxPlayers = 0;

  public tabsModel = {};

  mounted() {
    this.init();
  }

  private init() {
    if (!this.tournament) {
      this.mapPool = this.maps.slice(0, 5).map((m) => m.id);
      return;
    }

    const startDateTime = formatTimestampString(this.tournament.startDateTime, "yyyy-MM-dd HH:mm");

    this.name = this.tournament.name;
    this.gateway = this.tournament.gateway;
    this.startDate = startDateTime.toString().substring(0, 10);
    this.startTime = startDateTime.toString().substring(11, 16);
    this.mode = this.tournament.mode;
    this.format = this.tournament.format;
    this.mapPool = this.tournament.mapPool;
    this.state = this.tournament.state;
    this.registrationTimeMinutes = this.tournament.registrationTimeMinutes;
    this.readyTimeSeconds = this.tournament.readyTimeSeconds;
    this.vetoTimeSeconds = this.tournament.vetoTimeSeconds;
    this.showWinnerTimeHours = this.tournament.showWinnerTimeHours;
    this.matcherinoUrl = this.tournament.matcherinoUrl ?? "";
    this.maxPlayers = this.tournament.maxPlayers;
  }

  get isEdit() {
    return !!this.tournament;
  }

  get formValid() {
    if (this.mapPool.length < 3) {
      return false;
    }
    return true;
  }

  public cancel() {
    this.$emit("cancel");
  }

  public save() {
    const fieldNames = [
      "name", "gateway", "startDateTime", "mode", "format", "mapPool", "state",
      "registrationTimeMinutes", "readyTimeSeconds", "vetoTimeSeconds",
      "showWinnerTimeHours", "matcherinoUrl", "maxPlayers",
    ];

    this.startDateTime = new Date(`${this.startDate} ${this.startTime}`);

    const tournamentData = pick(this, fieldNames);
    this.$emit("save", tournamentData);
  }

  get gateways() {
    return this.getSelectOptions(EGatewayLabel);
  }

  get states() {
    const validStates = pickBy(ETournamentState, (_value, key) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return !isNaN(key as any);
    }) as { [key: number]: string };
    return this.getSelectOptions(validStates);
  }

  get gameModes() {
    return this.getSelectOptions(EGameModeLabel);
  }

  get formats() {
    return this.getSelectOptions(ETournamentFormatLabel).slice(0, 1);
  }

  get mapOptions() {
    return this.maps;
  }

  private getSelectOptions(labelMap: { [key: number]: string }) {
    return map(labelMap, (name, id) => ({
      id: +id,
      name,
    }));
  }
}
</script>
