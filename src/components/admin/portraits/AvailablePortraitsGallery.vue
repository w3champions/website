<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <v-row no-gutters :justify="'start'">
      <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
        <assign-portrait :portraitId="portraitId" :selectable="selectable" class="pa-1"></assign-portrait>
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { PortraitDefinition } from "@/store/admin/types";
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";
import AssignPortrait from "./AssignPortrait.vue";

@Component({ components: { AssignPortrait } })
export default class AvailablePortraitsGallery extends Vue {
  @Prop() selectable!: boolean;

  allSpecialPortraits = [] as PortraitDefinition[];

  async init(): Promise<void> {
    const specials = this.$store.direct.state.admin.playerManagement.allSpecialPortraits;

    if (specials && specials.length > 0) {
      this.allSpecialPortraits = Object.create(specials.map((x) => parseInt(x.id)).sort((a, b) => b - a));
    } else {
      await this.$store.direct.dispatch.admin.playerManagement.loadAllSpecialPortraits();
      this.allSpecialPortraits = Object.create(
        this.$store.direct.state.admin.playerManagement.allSpecialPortraits
          .map((x) => parseInt(x.id))
          .sort((a, b) => b - a)
      );
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
