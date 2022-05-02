<template>
  <v-container>
    <v-row class="mb-1 pb-1">
      <v-card-text>
        This page is for adding new portraits and adding/editing what groups they are a part of, e.g.
        <strong>Bronze Patreon Tier</strong>
      </v-card-text>
    </v-row>
    <v-row class="justify-center ma-1 pa-1">
      <v-btn class="secondary w3-race-bg--text">Add New Portrait (Coming Soon!)</v-btn>
    </v-row>
    <v-row class="ma-1 pa-1">
      <new-portrait-definition-dialog></new-portrait-definition-dialog>
    </v-row>

    <v-dialog v-model="editDialogOpen" max-width="650">
      <v-card>
        <v-container class="pa-6">
          <v-row class="justify-center">
            <v-card-title>Edit PortraitDefinition</v-card-title>
          </v-row>
          <v-row class="justify-center pt-0 mt-0">
            <v-card-title>Portrait Id: {{ editPortraitId }}</v-card-title>
          </v-row>
          <v-row>
            <v-col />
            <v-col>
              <assign-portrait :portraitId="editPortraitId" :selectable="false"/>
            </v-col>
            <v-col />
          </v-row>
          <v-row class="justify-center">
            <v-col>
              <portrait-group-combobox :portraitId="editPortraitId" />
            </v-col>
          </v-row>
          <v-row class="justify-center pb-5">
            <v-btn x-large class="primary w3-race-bg--text">Change groups</v-btn>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <v-row class="mt-1 pt-1">
      <v-card-text>Click on a portrait in the grid below to edit it's groups.</v-card-text>
    </v-row>

    <v-row>
      <available-portraits-gallery @portrait-selected="selectPortrait" />
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import NewPortraitDefinitionDialog from "./portraits/NewPortraitDefinitionDialog.vue";
import AssignPortrait from "./portraits/AssignPortrait.vue";
import PortraitGroupCombobox from "./portraits/PortraitGroupCombobox.vue";

@Component({
  components: {
    AvailablePortraitsGallery,
    NewPortraitDefinitionDialog,
    AssignPortrait,
    PortraitGroupCombobox,
  },
})
export default class AdminManagePortraits extends Vue {
  editPortraitId = 0;
  editDialogOpen = false;

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  selectPortrait(portraitId: number): void {
    this.editPortraitId = portraitId;
    this.editDialogOpen = true;
  }

  exitDialog(): void {
    this.editPortraitId = 0;
    this.editDialogOpen = false;
  }

  async init(): Promise<void> {
    if (this.isAdmin) {
      return;
    }
  }

  async mounted(): Promise<void> {
    await this.init();
  }
}
</script>

<style lang="scss"></style>
