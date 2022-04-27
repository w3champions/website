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

    <edit-portrait-definition-dialog></edit-portrait-definition-dialog>

    <v-row>
      <available-portraits-gallery @portrait-selected="selectPortrait" :selectable="true"></available-portraits-gallery>
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
import EditPortraitDefinitionDialog from "./portraits/EditPortraitDefinitionDialog.vue";

@Component({ components: { AvailablePortraitsGallery, NewPortraitDefinitionDialog, EditPortraitDefinitionDialog } })
export default class AdminManagePortraits extends Vue {
  editPortraitId = 0;
  editPortraitDialog = false;

  get isAdmin(): boolean {
    return this.$store.direct.state.oauth.isAdmin;
  }

  selectPortrait(id: number): void {
    this.editPortraitId = id;
    this.editPortraitDialog = true;
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
