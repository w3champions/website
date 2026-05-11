<template>
  <v-dialog max-width="500">
    <v-card>
      <v-card-title class="justify-center">
        {{ name }}
      </v-card-title>
      <v-container>
        <v-row>
          <v-img :src="`/assets/socials/QR/${name}_QR.png`" />
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
defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  hide: [void];
}>();
</script>
