<template>
  <v-dialog v-model="show" max-width="500" @click:outside="show = false">
    <v-card>
      <v-card-title class="justify-center">
        {{ cryptoName }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="`/assets/socials/QR/${crypto}_QR.png`"></v-img>
        </v-row>

        <v-row class="mt-2">
          <v-spacer></v-spacer>
          <copy-button :copyText="cryptoAddress"></copy-button>
          <v-spacer></v-spacer>
        </v-row>

        <v-row class="mt-2">
          <v-spacer></v-spacer>
          <v-card elevation="0" max-width="500">
            <v-spacer></v-spacer>
            <v-card-text>
              {{ cryptoAddress }}
            </v-card-text>
            <v-spacer></v-spacer>
          </v-card>
          <v-spacer></v-spacer>
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
import { computed, defineComponent, WritableComputedRef } from "vue";
import CopyButton from "./CopyButton.vue";

export default defineComponent({
  name: "CryptoDialog",
  components: {
    CopyButton
  },
  props: {
    crypto: { type: String, required: true },
    cryptoName: { type: String, required: true },
    cryptoAddress: { type: String, required: true },
    value: { type: Boolean, required: false, default: false },
  },
  setup(props, context) {
    const show: WritableComputedRef<boolean> = computed({
      get(): boolean {
        return props.value;
      },
      set(val: boolean): void {
        context.emit("input", val);
      },
    });

    return {
      show,
    };
  },
});
</script>
