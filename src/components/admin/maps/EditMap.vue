<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">{{ title }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="mapRef.name" label="Name" autofocus />
          </v-col>

          <v-tooltip left v-if="isAddDialog">
            <template #activator="{ on, attrs }">
              <v-col cols="12" sm="6" md="12">
                <v-text-field v-model="mapId" label="Id" v-bind="attrs" v-on="on" />
              </v-col>
            </template>
            <span>Leave blank to auto assign an Id</span>
          </v-tooltip>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="mapRef.category" label="Category" />
          </v-col>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="mapRef.maxTeams" label="Max Teams" />
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn text @click="cancel">
        {{ $t(`views_admin.cancel`) }}
      </v-btn>
      <v-btn color="primary" class="w3-race-bg--text" @click="save">
        {{ $t(`views_admin.save`) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { Map } from "@/store/admin/mapsManagement/types";

export default defineComponent({
  name: "EditMap",
  components: {},
  props: {
    map: {
      type: Object as PropType<Map>,
      required: true,
    },
    isAddDialog: {
      type: Boolean,
      required: true,
    },
  },
  setup(props, context) {
    const mapId = ref<number | null>(null);
    const title = ref<string>(props.isAddDialog ? "Create map" : "Edit map");
    const mapRef = ref<Map>(props.map);

    function cancel() {
      context.emit("cancel");
    }

    function save() {
      // const editedMap = Object.create(props.map);
      if (props.isAddDialog && mapId.value !== null) {
        mapRef.value.id = mapId.value;
      }
      context.emit("save", mapRef.value);
    }

    return {
      mapId,
      title,
      cancel,
      save,
      mapRef,
    };
  },
});
</script>
