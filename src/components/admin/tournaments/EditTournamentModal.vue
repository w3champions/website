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
          <v-row>
            <v-col cols="3">
              <v-select
                :items="[2, 4, 8, 16, 32, 64]"
                v-model="maxPlayers"
                label="Max Players"
                outlined
              />
            </v-col>
            <v-col cols="3">
              <v-select
                :items="enabledFloNodes"
                v-model="floNode"
                label="Flo Node"
                item-text="name"
                return-object
                outlined
                @change="setFloNode"
              />
            </v-col>
            <v-col cols="3">
              <v-select
                :items="[100, 200, 300, 400]"
                v-model="floNodeMaxPing"
                label="Flo Node Max Ping"
                outlined
                :disabled="floNode === null"
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
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import map from "lodash/map";
import pickBy from "lodash/pickBy";
import { ETournamentFormat, ETournamentState, ITournament, ITournamentFloNode } from "@/store/tournaments/types";
import { EGameMode } from "@/store/types";
import { EGameModeLabel, ETournamentFormatLabel } from "@/helpers/tournaments";
import { Map } from "@/store/admin/mapsManagement/types";
import { formatISO } from "date-fns";
import { formatTimestampString } from "@/helpers/date-functions";
import { useTournamentsManagementStore } from "@/store/admin/tournamentsManagement/store";

export default defineComponent({
  name: "EditTournamentModal",
  components: {},
  props: {
    tournament: {
      type: Object as PropType<ITournament>,
      required: false,
      default: undefined,
    },
    saving: {
      type: Boolean,
      required: true,
    },
    maps: {
      type: Array<Map>,
      required: true,
    },
  },
  setup(props, context) {
    const tournamentsManagementStore = useTournamentsManagementStore();
    const now = formatISO(new Date());
    const name = ref<string>("Standard One vs One Tournament");
    const startDate = ref<string>(now.substring(0, 10));
    const startTime = ref<string>(now.substring(11, 16));
    const startDateTime = ref<Date>(new Date());
    const mode = ref<EGameMode>(EGameMode.GM_1ON1_TOURNAMENT);
    const format = ref<ETournamentFormat>(ETournamentFormat.SINGLE_ELIM);
    const mapPool = ref<number[]>([]);
    const state = ref<ETournamentState>(ETournamentState.INIT);
    const registrationTimeMinutes = ref<number>(5);
    const readyTimeSeconds = ref<number>(180);
    const vetoTimeSeconds = ref<number>(45);
    const showWinnerTimeHours = ref<number>(24);
    const matcherinoUrl = ref<string>("");
    const maxPlayers = ref<number | null>(null);
    const floNodeMaxPing = ref<number | null>(null);
    const floNode = ref<ITournamentFloNode | null>(null);
    const tabsModel = ref({});

    const isEdit = computed<boolean>(() => !!props.tournament);
    const mapOptions = computed<Map[]>(() => props.maps);
    const gameModes = computed<{id: number; name: string}[]>(() => getSelectOptions(EGameModeLabel));
    const formats = computed<{id: number; name: string}[]>(() => getSelectOptions(ETournamentFormatLabel).slice(0, 1));
    const enabledFloNodes = computed<ITournamentFloNode[]>(() => tournamentsManagementStore.floNodes);

    const states = computed<{id: number; name: string}[]>(() => {
      const validStates = pickBy(ETournamentState, (_value, key) => {
        return !isNaN(Number(key));
      }) as { [key: number]: string };
      return getSelectOptions(validStates);
    });

    const formValid = computed<boolean>(() => mapPool.value.length >= 3);

    function cancel(): void {
      context.emit("cancel");
    }

    function save(): void {
      startDateTime.value = new Date(`${startDate.value} ${startTime.value}`);

      const tournamentData = {
        name: name.value,
        startDateTime: startDateTime.value,
        mode: mode.value,
        format: format.value,
        mapPool: mapPool.value,
        state: state.value,
        registrationTimeMinutes: registrationTimeMinutes.value,
        readyTimeSeconds: readyTimeSeconds.value,
        vetoTimeSeconds: vetoTimeSeconds.value,
        showWinnerTimeHours: showWinnerTimeHours.value,
        matcherinoUrl: matcherinoUrl.value,
        maxPlayers: maxPlayers.value,
        floNode: floNode.value,
        floNodeMaxPing: floNodeMaxPing.value
      };

      context.emit("save", tournamentData);
    }

    function getSelectOptions(labelMap: { [key: number]: string }) {
      return map(labelMap, (name, id) => ({
        id: +id,
        name,
      }));
    }

    function setFloNode(node: ITournamentFloNode) {
      floNode.value = node;
      floNodeMaxPing.value = 100;
    }

    onMounted((): void => {
      init();
    });

    function init(): void {
      if (!props.tournament) {
        mapPool.value = props.maps.slice(0, 5).map((m) => m.id);
        return;
      }

      const startDateTime = formatTimestampString(props.tournament.startDateTime, "yyyy-MM-dd HH:mm");

      name.value = props.tournament.name;
      startDate.value = startDateTime.substring(0, 10);
      startTime.value = startDateTime.substring(11, 16);
      mode.value = props.tournament.mode;
      format.value = props.tournament.format;
      mapPool.value = props.tournament.mapPool;
      state.value = props.tournament.state;
      registrationTimeMinutes.value = props.tournament.registrationTimeMinutes;
      readyTimeSeconds.value = props.tournament.readyTimeSeconds;
      vetoTimeSeconds.value = props.tournament.vetoTimeSeconds;
      showWinnerTimeHours.value = props.tournament.showWinnerTimeHours;
      matcherinoUrl.value = props.tournament.matcherinoUrl ?? "";
      maxPlayers.value = props.tournament.maxPlayers;
      floNode.value = props.tournament.floNode;
      floNodeMaxPing.value = props.tournament.floNodeMaxPing;
    }

    return {
      isEdit,
      tabsModel,
      name,
      startDate,
      startTime,
      mapOptions,
      states,
      state,
      mapPool,
      registrationTimeMinutes,
      readyTimeSeconds,
      vetoTimeSeconds,
      showWinnerTimeHours,
      matcherinoUrl,
      gameModes,
      mode,
      formats,
      format,
      maxPlayers,
      enabledFloNodes,
      floNode,
      setFloNode,
      floNodeMaxPing,
      cancel,
      save,
      formValid,
    };
  },
});
</script>
