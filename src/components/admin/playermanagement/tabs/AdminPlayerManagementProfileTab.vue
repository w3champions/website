<template>
  <player 
    :id="battleTag"
    :freshLogin="false"
    :adminView="true"></player>
</template>

<script lang="ts">
import Vue from "vue"; 
import { Component } from "vue-property-decorator";
import Player from "@/views/Player.vue"

@Component({ components: { Player }})
export default class AdminPlayerManagementProfileTab extends Vue {
  public battleTag = "setcho#2271"
}
</script>

<style lang="scss"></style>
