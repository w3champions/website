<template>
  <v-dialog v-model="value" max-width="500" @click:outside="close">
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
          <v-btn @click="close">Close</v-btn>
          <v-spacer></v-spacer>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent } from "vue";
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
    value: { type: Boolean, required: true },
  },
  setup(props, context) {
    function close(): void {
      context.emit("input", false);
    }

    return {
      close,
    };
  },
});
</script>
