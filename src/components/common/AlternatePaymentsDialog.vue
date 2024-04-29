<template>
  <v-dialog v-model="value" max-width="500" @click:outside="close">
    <v-card>
      <v-card-title class="justify-center">
        {{ name }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="`/assets/socials/QR/${name}_QR.png`"></v-img>
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

export default defineComponent({
  name: "AlternatePaymentsDialog",
  components: {},
  props: {
    name: {
      type: String,
      required: true,
    },
    value: {
      type: Boolean,
      required: true,
    },
  },
  setup(_props, context) {
    function close(): void {
      context.emit("input", false);
    }

    return {
      close,
    };
  },
});
</script>
