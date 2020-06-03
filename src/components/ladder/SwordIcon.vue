<template>
  <img :src="swordIcon()" class="sword-icon" />
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class SwordIcon extends Vue {
  swordIcon() {
    return require("../../assets/swords.svg");
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
