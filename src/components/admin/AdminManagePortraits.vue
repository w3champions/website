<template>
  <v-container>
    <v-row>
      <v-card-text>
        Special portrait filenames are of the format:
        <b>SPECIAL_XXXX.jpg</b>
        where XXXX is the portrait's id number.
        <br />
        We store this as a
        <i>PortraitDefinition.</i>
        <br />
        You can see a gallery of all the portrait definitions at the bottom of this page.
        <br />
        a
        <i>PortraitDefinition</i>
        also stores a list of groups that the portrait belongs to, this allows easy mass-assignment of portraits by
        their group tag.
        <br />
        Example groups: "s10", "bronze-patreon" etc.
      </v-card-text>
      <new-portrait-definition-dialog></new-portrait-definition-dialog>
    </v-row>

    <v-dialog v-model="editDialogOpen" max-width="500">
      <v-card>
        <v-container>
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
              Change groups here
            </v-col>
          </v-row>
        </v-container>
      </v-card>
    </v-dialog>

    <v-row>
      <available-portraits-gallery @portrait-selected="selectPortrait" />
    </v-row>

    <!-- add a new portrait definition ID interface -->
    <!-- on clicking the portraits gallery, open a modal to edit that portrait's groups -->
    <!-- maybe add tooltips that show what group the portrait in the gallery is part of? -->
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Component } from "vue-property-decorator";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import NewPortraitDefinitionDialog from "./portraits/NewPortraitDefinitionDialog.vue";
import AssignPortrait from "./portraits/AssignPortrait.vue";

@Component({ components: { AvailablePortraitsGallery, NewPortraitDefinitionDialog, AssignPortrait } })
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
