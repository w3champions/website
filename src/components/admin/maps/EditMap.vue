<template>
  <v-card>
    <v-card-title>
      {{ title }}
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="mapRef.name"
              label="Name"
              autofocus
              variant="underlined"
              color="primary"
            />
          </v-col>

          <v-col cols="12" sm="6">
            <!-- Existing categories as suggestions, but free text so a new one can
                 be typed straight in. -->
            <v-combobox
              v-model="mapRef.category"
              :items="categories"
              label="Category"
              variant="underlined"
              color="primary"
              hide-details
            />
          </v-col>

          <v-col v-if="isAddDialog" cols="12" sm="4">
            <v-text-field
              v-model="mapId"
              label="ID"
              type="number"
              hint="Leave blank to auto assign an ID"
              persistent-hint
              variant="underlined"
              color="primary"
            />
          </v-col>

          <v-col cols="12" :sm="isAddDialog ? 4 : 6">
            <v-text-field
              v-model.number="mapRef.maxTeams"
              label="Max Teams"
              type="number"
              min="1"
              variant="underlined"
              color="primary"
            />
          </v-col>

          <v-col cols="12" :sm="isAddDialog ? 4 : 6" class="d-flex align-center">
            <v-checkbox
              v-model="mapRef.disabled"
              label="Disable map"
              class="text-medium-emphasis"
              hide-details
            />
          </v-col>

          <v-col cols="12" class="pt-0">
            <mapped-forces-editor
              v-model="mappedForces"
              @update:valid="isMappedForcesValid = $event"
            />
          </v-col>

          <!-- What the selected file actually contains, to check the settings above
               against. Warnings here never block saving. -->
          <v-col v-if="!isAddDialog" cols="12">
            <!-- The panel title names the section; a separate label above it just
                 repeated itself. -->
            <map-file-details
              :game-map="mapRef.gameMap"
              :map="mapRef"
              details-title="Selected map file"
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
      <v-btn class="bg-primary text-w3-race-bg" :disabled="!isMappedForcesValid" @click="save">
        {{ $t(`views_admin.save`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { Map, MapForce } from "@/store/admin/mapsManagement/types";
import MappedForcesEditor from "./MappedForcesEditor.vue";
import MapFileDetails from "./MapFileDetails.vue";

export default defineComponent({
  name: "EditMap",
  components: { MappedForcesEditor, MapFileDetails },
  props: {
    map: {
      type: Object as PropType<Map>,
      required: true,
    },
    isAddDialog: {
      type: Boolean,
      required: true,
    },
    // Suggestions only; the field stays free text.
    categories: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  setup(props, context) {
    const mapId = ref<number | null>(null);
    const title = ref<string>(props.isAddDialog ? "Create map" : "Edit map");
    const mapRef = ref<Map>(props.map);
    const mappedForces = ref<MapForce[]>(props.map.mappedForces ?? []);
    const isMappedForcesValid = ref<boolean>(true);

    function cancel() {
      context.emit("cancel");
    }

    function save() {
      if (!isMappedForcesValid.value) return;

      if (props.isAddDialog && mapId.value !== null) {
        mapRef.value.id = mapId.value;
      }
      mapRef.value.mappedForces = mappedForces.value;
      context.emit("save", mapRef.value);
    }

    return {
      mapId,
      title,
      cancel,
      save,
      mapRef,
      mappedForces,
      isMappedForcesValid,
    };
  },
});
</script>
