<template>
  <v-dialog v-model="show" max-width="500">
    <v-card>
      <v-card-title class="justify-center">
        {{ this.name }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="require(`@/assets/socials/QR/${name}_QR.png`)"></v-img>
        </v-row>

        <v-row class="mt-2">
          <v-spacer></v-spacer>
          <v-btn @click.stop="show = false">Close</v-btn>
          <v-spacer></v-spacer>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { Component, Prop } from "vue-property-decorator";

@Component({})
export default class AlternatePaymentsDialog extends Vue {
  @Prop() name!: string;
  @Prop() value!: boolean;

  get show(): boolean {
    return this.value;
  }

  set show(value: boolean) {
    this.$emit("input", value);
  }
}
</script>
