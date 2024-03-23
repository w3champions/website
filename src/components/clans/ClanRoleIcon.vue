<template>
  <img :src="icon()" class="league-icon" alt="league" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EClanRole } from "@/store/clan/types";

@Component({})
export default class ClanRoleIcon extends Vue {
  @Prop() role!: EClanRole;

  icon(): string {
    return `/assets/clanRoleIcon/${EClanRole[this.role]}.jpg`;
  }
}
</script>

<style lang="scss" scoped>
.league-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
