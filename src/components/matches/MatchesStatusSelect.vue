<template>
  <v-menu offset-x>
    <template v-slot:activator="{ on }">
      <v-btn tile v-on="on" style="background-color: transparent">
        <v-icon style="margin-right: 5px">mdi-controller-classic</v-icon>
        {{ status }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-content>
            <v-list-item-title>
              {{ $t("components_matches_matchesstatusselect.selectstatus") }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list>
        <v-divider></v-divider>
        <v-list dense>
          <v-list-item
            v-for="mode in matchStatuses"
            :key="mode.status"
            @click="setStatus(mode.status)"
          >
            <v-list-item-content>
              <v-list-item-title>{{ mode.name }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";

import { MatchStatus } from "@/store/match/types";

@Component({})
export default class MatchesStatusSelect extends Vue {
  get status() {
    const selectedStatus = this.$store.direct.state.matches.status;
    return this.matchStatuses.filter((x) => x.status == selectedStatus)[0].name;
  }

  get matchStatuses() {
    return [
      {
        name: this.$t(`matchStatuses.onGoing`),
        status: MatchStatus.onGoing,
      },
      {
        name: this.$t(`matchStatuses.past`),
        status: MatchStatus.past,
      },
    ];
  }

  public setStatus(status: MatchStatus) {
    this.$store.direct.dispatch.matches.setStatus(status);
  }
}
</script>

<style></style>
