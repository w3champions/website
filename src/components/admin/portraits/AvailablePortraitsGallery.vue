<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <v-row no-gutters :justify="'start'">
      <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
        <assign-portrait :portraitId="portraitId" class="pa-1" :selectable="selectable" />
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { PortraitDefinition } from "@/store/admin/types";
import { Component, Prop, Vue } from "vue-facing-decorator";
import AssignPortrait from "./AssignPortrait.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

@Component({ components: { AssignPortrait } })
export default class AvailablePortraitsGallery extends Vue {
  @Prop({ default: true }) public selectable?: boolean;
  allSpecialPortraits = [] as PortraitDefinition[];
  private playerManagement = usePlayerManagementStore();

  async init(): Promise<void> {
    const specials = this.playerManagement.allSpecialPortraits;

    if (specials && specials.length > 0) {
      this.allSpecialPortraits = Object.create(specials.map((x) => parseInt(x.id)).sort((a, b) => b - a));
    } else {
      await this.playerManagement.loadAllSpecialPortraits();
      this.allSpecialPortraits = Object.create(
        this.playerManagement.allSpecialPortraits
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
