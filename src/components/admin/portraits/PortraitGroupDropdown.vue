<template>
  <v-container>
    <v-menu bottom>
      <template v-slot:activator="{ on: onMenu }">
        <v-btn color="primary w3-race-bg--text" dark v-on="{ ...onMenu }">
          Select Portrait Groups
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list max-height="400" class="overflow-y-auto">
        <v-list-item v-for="group in groupNames" :key="group">
          <v-tooltip left max-width="500" min-width="500">
            <template v-slot:activator="{ on: onTooltip }">
              <v-list-item v-on="{ ...onTooltip }" @click="addPortraitGroup(group)">
                {{ group }}
              </v-list-item>
            </template>
            <v-row no-gutters justify="start">
              <v-col v-for="portraitId in hoveredGroupPortraits(group)" :key="portraitId" cols="1" md="1">
                <assign-portrait
                  :portraitId="portraitId"
                  :isAssigned="false"
                  :isInert="true"
                  class="pa-1"
                ></assign-portrait>
              </v-col>
            </v-row>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<script lang="ts">
import { PortraitDefinitionGroup } from "@/store/admin/types";
import AssignPortrait from "./AssignPortrait.vue";
import Vue from "vue";
import { Component } from "vue-property-decorator";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

@Component({ components: { AssignPortrait } })
export default class PortraitGroupDropdown extends Vue {
  selectedGroups = [] as string[];
  portraitDefGroups = [] as PortraitDefinitionGroup[];
  groupNames = [] as string[];
  private playerManagement = usePlayerManagementStore();

  addPortraitGroup(group: string): void {
    const portraitsToAdd = this.portraitDefGroups.find((x) => x.group == group)?.portraitIds;
    if (portraitsToAdd) {
      this.$emit("add-group-of-portraits", portraitsToAdd);
    }
  }

  hoveredGroupPortraits(defGroup: string): number[] {
    return this.portraitDefGroups.find((x) => x.group == defGroup)?.portraitIds || [];
  }

  async init(): Promise<void> {
    await this.playerManagement.loadPortraitDefinitionGroups();
    this.portraitDefGroups = this.playerManagement.portraitDefinitionGroups;
    this.groupNames = this.portraitDefGroups
      .filter((x) => x.group) // no scuffed group names like "" or null
      .map((x) => x.group);
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss">
$tooltip-opacity: 1;
</style>
