<template>
  <v-container>
    <v-row class="mb-1 pb-1">
      <v-card-text>
        This page is for adding new portraits and adding/editing what groups they are a part of, e.g.
        <strong>Bronze Patreon Tier</strong>
      </v-card-text>
    </v-row>
    <v-row class="justify-center ma-1 pa-1">
      <v-btn class="secondary w3-race-bg--text" :disabled="true">Add New Portrait (Coming Soon)</v-btn>
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
              <assign-portrait :portraitId="editPortraitId" :selectable="false" />
            </v-col>
            <v-col />
          </v-row>
          <v-row class="justify-center">
            <v-card-actions>
              <portrait-group-combobox @groups-changed="updateGroupModel" :portraitId="editPortraitId" />
            </v-card-actions>
          </v-row>
          <v-row class="justify-center">
            <v-card-actions>
              <v-col>
                <v-btn x-large class="primary w3-race-bg--text" @click="changeGroups">Change groups</v-btn>
              </v-col>
              <v-col>
                <v-btn x-large class="error w3-race-bg--text" @click="confirmDeleteDialogOpen = true">
                  Delete Definition
                </v-btn>
                <v-dialog v-model="confirmDeleteDialogOpen" width="300">
                  <v-card>
                    <v-card-title class="justify-center">{{ editPortraitId }}</v-card-title>
                    <v-card-text>Are you sure you want to delete this definition?</v-card-text>
                    <v-card-actions>
                      <v-row class="justify-center pa-3">
                        <v-col>
                          <v-btn class="primary w3-race-bg--text" @click="confirmDelete">Confirm</v-btn>
                        </v-col>
                        <v-col>
                          <v-btn class="info w3-race-bg--text" @click="confirmDeleteDialogOpen = false">Cancel</v-btn>
                        </v-col>
                      </v-row>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-col>
            </v-card-actions>
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
import { PortraitDefinitionDTO } from "@/store/admin/types";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

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
  confirmDeleteDialogOpen = false;
  groupsModel = [] as string[];
  private playerManagement = usePlayerManagementStore();

  selectPortrait(portraitId: number): void {
    this.editPortraitId = portraitId;
    this.editDialogOpen = true;
  }

  exitDialog(): void {
    this.editPortraitId = 0;
    this.editDialogOpen = false;
  }

  updateGroupModel(groups: string[]): void {
    this.groupsModel = groups;
  }

  async changeGroups(): Promise<void> {
    await this.playerManagement.updatePortraitDefinition({
      ids: [this.editPortraitId],
      groups: this.groupsModel,
    } as PortraitDefinitionDTO);
    this.editDialogOpen = false;
  }

  async confirmDelete(): Promise<void> {
    await this.playerManagement.removePortraitDefinition({
      ids: [this.editPortraitId],
    } as PortraitDefinitionDTO);
    this.confirmDeleteDialogOpen = false;
  }
}
</script>

<style lang="scss"></style>
