<template>
  <v-img :src="urlById"></v-img>
</template>

<script lang="ts">
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/typings";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({ components: {} })
export default class AssignPortrait extends Vue {
  @Prop({}) public portraitId!: number;

  get urlById() {
    return getAvatarUrl(EAvatarCategory.SPECIAL, this.portraitId, false);
  }
}
</script>

<style lang="scss"></style>
