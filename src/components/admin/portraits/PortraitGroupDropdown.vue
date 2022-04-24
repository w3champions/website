<template>
  <v-container>
    <v-menu bottom>
      <template v-slot:activator="{ on: onMenu }">
        <v-btn color="primary" dark v-on="{ ...onMenu }">
          Select Portrait Groups
          <v-icon>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item v-for="group in groupNames" :key="group">
          <v-tooltip left>
            <template v-slot:activator="{ on: onTooltip }">
              <v-list-item v-on="{ ...onTooltip }" @click="addPortraitGroup(group)">
                {{ group }}
              </v-list-item>
            </template>
            <span>{{ group }}</span>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<script lang="ts">
import { PortraitDefinitionGroup } from "@/store/admin/types";
import Vue from "vue";
import { Component } from "vue-property-decorator";

@Component({ components: {} })
export default class PortraitGroupDropdown extends Vue {
  selectedGroups = [] as string[];
  portraitDefGroups = [] as PortraitDefinitionGroup[];
  groupNames = [] as string[];

  addPortraitGroup(group: string): void {
    const portraitsToAdd = this.portraitDefGroups.find((x) => x.group == group)?.portraitIds;
    if (portraitsToAdd) {
      this.$emit("add-group-of-portraits", portraitsToAdd);
    }
  }

  async init(): Promise<void> {
    await this.$store.direct.dispatch.admin.playerManagement.loadPortraitDefinitionGroups();
    this.portraitDefGroups = this.$store.direct.state.admin.playerManagement.portraitDefinitionGroups;
    this.groupNames = this.portraitDefGroups
      .filter((x) => x.group) // no scuffed group names like "" or null
      .map((x) => x.group);
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
