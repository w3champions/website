<template>
  <v-tooltip top v-if="season">
    <template v-slot:activator="{ on }">
      <div
        @click="() => onClick(season)"
        v-on="on"
        class="season-badge pointer"
        :style="{ 'background-image': 'url(' + seasonBadgeBg + ')' }"
      />
    </template>
    <span>
      {{ $t("components_player_seasonbadge.participatedinseason") }}
      {{ seasonId }}
    </span>
  </v-tooltip>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { Season } from "@/store/ranking/types";
import { getAsset } from "@/helpers/url-functions";

@Component({})
export default class SeasonBadge extends Vue {
  @Prop() season!: Season;
  @Prop() onClick!: (season: Season) => void;

  get seasonId() {
    return this.season.id === 0 ? "β" : this.season.id;
  }

  get seasonBadgeBg() {
    return getAsset(`seasonBadges/Season_${this.season.id}.png`);
  }
}
</script>

<style lang="scss" scoped>
.season-badge {
  margin-right: 10px;
  width: 24px;
  height: 24px;
  background-size: cover;
}
</style>
