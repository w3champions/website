<template>
  <div>
    <v-card-title class="pt-3">
      Manage Portraits
    </v-card-title>
    <v-container class="w3-container-width">
      <div class="portrait-management__intro">
        <p>Add a custom portrait, or select an existing one to manage its image, groups and assigned players.</p>
        <p class="text-caption text-medium-emphasis">For a personal supporter portrait, leave groups empty and assign it directly to the player.</p>
        <div class="portrait-management__actions">
          <add-new-portrait-dialog />
          <new-portrait-definition-dialog />
          <new-portrait-definition-dialog mode="empty" />
        </div>
      </div>

      <portrait-details-dialog v-model="editDialogOpen" :portraitId="editPortraitId" @image-uploaded="imageVersion = Date.now()" />

      <v-row class="mt-1 pt-1">
        <v-card-text>Click on a portrait in the grid below to edit its groups or replace its image for existing owners.</v-card-text>
      </v-row>

      <v-row>
        <available-portraits-gallery :imageVersion="imageVersion" @portrait-selected="selectPortrait" />
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import AvailablePortraitsGallery from "./portraits/AvailablePortraitsGallery.vue";
import NewPortraitDefinitionDialog from "./portraits/NewPortraitDefinitionDialog.vue";
import AddNewPortraitDialog from "./portraits/AddNewPortraitDialog.vue";
import PortraitDetailsDialog from "./portraits/PortraitDetailsDialog.vue";
const editPortraitId = ref(0);
const editDialogOpen = ref(false);
const imageVersion = ref(0);
function selectPortrait(portraitId: number): void {
  editPortraitId.value = portraitId;
  editDialogOpen.value = true;
}
</script>

<style scoped>
.portrait-management__intro {
  padding: 0 12px 24px;
}
.portrait-management__intro p {
  margin-bottom: 8px;
}
.portrait-management__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
</style>
