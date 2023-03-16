<template>
  <v-card>
    <v-card-title>
      <span class="text-h5">{{ title }}</span>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="map.name" label="Name"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="map.category" label="Category"></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="12">
            <v-text-field v-model="map.maxTeams" label="Max Teams"></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
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
import { Map } from "@/store/admin/maps/types";
import Vue from "vue";
import { Prop, Component } from "vue-property-decorator";

@Component({})
export default class EditMap extends Vue {
  @Prop() public map!: Map;

  public get title() {
    return this.map?.id > -1 ? "Edit map" : "Create map";
  }

  public cancel() {
    this.$emit("cancel");
  }

  public save() {
    this.$emit("save", this.map);
  }
}
</script>

<style></style>
