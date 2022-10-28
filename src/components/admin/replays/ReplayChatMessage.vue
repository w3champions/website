<template>
  <v-container class="ma-0 pa-0">
    <div v-if="isPrivate()">
      <span class="font-weight-bold" :class="getTeamColor(this.team)">{{ sentBy }} (to {{ sentTo }}): </span>
      <span class="black--text">{{ content }}</span>
    </div>
    <div v-else>
      <span class="font-weight-bold" :class="getTeamColor(this.team)">
        {{ sentBy }} ({{ scopeToString(this.scope) }}):
      </span>
      <span class="black--text">{{ content }}</span>
    </div>
  </v-container>
</template>

<script lang="ts">
import { Component, Prop } from "vue-property-decorator";
import { EChatScope } from "@/store/common/typings";
import Vue from "vue";

@Component({})
export default class ReplayChatMessage extends Vue {
  @Prop() sentBy!: string;
  @Prop() team!: number;
  @Prop() content!: string;
  @Prop() scope!: EChatScope;
  @Prop({ default: null }) sentTo?: string;

  getTeamColor(team: number): string {
    if (this.scope == EChatScope.OBSERVERS) return "black--text";

    switch (team) {
      case 0:
        return "red--text";
      case 1:
        return "blue--text";
      case 2:
        return "green--text";
      case 3:
        return "purple--text";
      default:
        return "black--text";
    }
  }

  scopeToString(scope: EChatScope): string {
    switch (scope) {
      case EChatScope.ALL:
        return "All";
      case EChatScope.ALLIES:
        return "Allies";
      case EChatScope.OBSERVERS:
        return "Observers";
      default:
        return "";
    }
  }

  isPrivate() {
    if (this.scope == EChatScope.PLAYER) return true;
    return false;
  }
}
</script>

<style scoped></style>
