<template>
  <div v-if="!unfinished" style="margin-left: auto;">
    <v-btn
      tile
      style="background-color: transparent"
      @click="toggle"
    >
      <v-icon start>{{ showHeroes ? mdiEyeOff : mdiEye }}</v-icon>
      {{ showHeroes ? $t('components_matches_matchesgrid.hideHeroIcons') : $t('components_matches_matchesgrid.showHeroIcons') }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { mdiEye, mdiEyeOff } from "@mdi/js";

const props = defineProps<{
  showHeroes: boolean;
  unfinished?: boolean;
}>();

const emit = defineEmits<{
  "update:showHeroes": [boolean];
}>();

function toggle() {
  emit("update:showHeroes", !props.showHeroes);
}
</script>
