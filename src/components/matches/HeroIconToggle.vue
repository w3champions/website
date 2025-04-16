<template>
  <div v-if="!unfinished" style="margin-left: auto;">
    <v-btn tile class="ml-4" @click="toggle" style="background-color: transparent; align-items: center;">
      <v-icon left>{{ showHeroes ? mdiEyeOff : mdiEye }}</v-icon>
      {{ showHeroes ? $t('components_matches_matchesgrid.hideHeroIcons') :
        $t('components_matches_matchesgrid.showHeroIcons') }}
    </v-btn>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mdiEye, mdiEyeOff } from "@mdi/js";

export default defineComponent({
  name: 'HeroIconToggle',
  props: {
    showHeroes: {
      type: Boolean,
      required: true,
    },
    unfinished: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['update:showHeroes'],
  setup(props, { emit }) {

    function toggle() {
      emit('update:showHeroes', !props.showHeroes);
    }

    return {
      toggle,
      mdiEye,
      mdiEyeOff,
    };
  },
});
</script>
