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

<script lang="ts">
import { defineComponent } from "vue";
import { mdiEye, mdiEyeOff } from "@mdi/js";

export default defineComponent({
  name: "HeroIconToggle",
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
  emits: ["update:showHeroes"],
  setup(props, { emit }) {

    function toggle() {
      emit("update:showHeroes", !props.showHeroes);
    }

    return {
      toggle,
      mdiEye,
      mdiEyeOff,
    };
  },
});
</script>
