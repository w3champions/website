<template>
  <div>
    <v-card-title>
      Manage Portraits
    </v-card-title>
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
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import NewPortraitDefinitionDialog from "./portraits/NewPortraitDefinitionDialog.vue";
import AssignPortrait from "./portraits/AssignPortrait.vue";
import PortraitGroupCombobox from "./portraits/PortraitGroupCombobox.vue";
import { PortraitDefinitionDTO } from "@/store/admin/types";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

export default defineComponent({
  name: "AdminManagePortraits",
  components: {
    AvailablePortraitsGallery,
    NewPortraitDefinitionDialog,
    AssignPortrait,
    PortraitGroupCombobox,
  },
  props: {},
  setup() {
    const playerManagement = usePlayerManagementStore();
    const editPortraitId = ref<number>(0);
    const editDialogOpen = ref<boolean>(false);
    const confirmDeleteDialogOpen = ref<boolean>(false);
    const groupsModel = ref<string[]>([]);

    function selectPortrait(portraitId: number): void {
      editPortraitId.value = portraitId;
      editDialogOpen.value = true;
    }

    function exitDialog(): void {
      editPortraitId.value = 0;
      editDialogOpen.value = false;
    }

    function updateGroupModel(groups: string[]): void {
      groupsModel.value = groups;
    }

    async function changeGroups(): Promise<void> {
      await playerManagement.updatePortraitDefinition({
        ids: [editPortraitId.value],
        groups: groupsModel.value,
      } as PortraitDefinitionDTO);
      editDialogOpen.value = false;
    }

    async function confirmDelete(): Promise<void> {
      await playerManagement.removePortraitDefinition({
        ids: [editPortraitId.value],
      } as PortraitDefinitionDTO);
      confirmDeleteDialogOpen.value = false;
    }

    return {
      editDialogOpen,
      editPortraitId,
      updateGroupModel,
      changeGroups,
      confirmDeleteDialogOpen,
      confirmDelete,
      selectPortrait,
    };
  },
});
</script>
