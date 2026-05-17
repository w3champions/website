<template>
  <v-container class="pa-0">
    <v-row class="pa-0">
      <v-col class="d-flex justify-center align-center">
        <img :src="flag()" width="22px" height="22px" />
      </v-col>
      <v-col v-if="showTwoLetterCode">{{ locale.toUpperCase() }}</v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const { locale, showTwoLetterCode = true } = defineProps<{
  locale: string;
  showTwoLetterCode?: boolean;
}>();

function flag(): string {
  return `/assets/localeFlags/${locale}.svg`;
}
</script>
