<template>
  <v-container class="ma-0 pa-0" @click="assignPortrait">
    <v-img :src="urlById"></v-img>
    <v-btn class="cancel-button" right v-if="isAssigned" icon @click="removeAssignedPortrait">
      <v-icon large>mdi-close-circle-outline</v-icon>
    </v-btn>
  </v-container>
</template>

<script lang="ts">
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/typings";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({ components: {} })
export default class AssignPortrait extends Vue {
  @Prop({}) public portraitId!: number;
  @Prop({ default: false }) public isAssigned!: boolean;

  get urlById() {
    return getAvatarUrl(EAvatarCategory.SPECIAL, this.portraitId, false);
  }

  removeAssignedPortrait(): void {
    this.$emit("remove-assigned-portrait", this.portraitId);
  }

  assignPortrait(): void {
    if (!this.isAssigned) {
      this.$emit("add-available-portrait", this.portraitId);
    }
  }
}
</script>

<style lang="scss">
.cancel-button {
  left: 27%;
}
</style>
