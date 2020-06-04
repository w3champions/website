<template>
  <img :src="icon()" class="league-icon" :alt="league" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import { EClanRole } from "@/store/clan/types";

@Component({})
export default class ClanRoleIcon extends Vue {
  @Prop() role!: EClanRole;

  icon() {
    const images = require.context(
      "../../assets/clanRoleIcon/",
      false,
      /\.jpg$/
    );
    return images("./" + EClanRole[this.role] + ".jpg");
  }
}
</script>

<style lang="scss" scoped>
.league-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
