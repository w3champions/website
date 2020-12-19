<template>
  <img :src="swordIcon()" class="sword-icon" />
</template>

<script lang="ts">
import { WEBSITE_ASSETS_URL } from "@/main";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class SwordIcon extends Vue {
  swordIcon() {
    return `${WEBSITE_ASSETS_URL}/swords.svg`;
  }
}
</script>

<style lang="scss" scoped>
.sword-icon {
  width: 18px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
