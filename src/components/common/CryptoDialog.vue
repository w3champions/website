<template>
  <v-dialog max-width="500">
    <v-card>
      <v-card-title class="justify-center">
        {{ cryptoName }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="`/assets/socials/QR/${crypto}_QR.png`" />
        </v-row>

        <v-row class="mt-2">
          <v-spacer />
          <copy-button :copyText="cryptoAddress" />
          <v-spacer />
        </v-row>

        <v-row class="mt-2">
          <v-spacer />
          <v-card elevation="0" max-width="500">
            <v-spacer />
            <v-card-text>
              {{ cryptoAddress }}
            </v-card-text>
            <v-spacer />
          </v-card>
          <v-spacer />
        </v-row>

        <v-row class="mt-2">
          <v-spacer />
          <v-btn @click.stop="emit('hide')">Close</v-btn>
          <v-spacer />
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import CopyButton from "./CopyButton.vue";

defineProps<{
  crypto: string;
  cryptoName: string;
  cryptoAddress: string;
}>();

const emit = defineEmits<{
  hide: [void];
}>();
</script>
