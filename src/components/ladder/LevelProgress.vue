<template>
  <v-progress-linear class="level-progress" :model-value="progressToNextLevel" height="25" color="level-progress-gradient">
    <strong>{{ levelNumber }}</strong>
  </v-progress-linear>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";

export default defineComponent({
  name: "LevelProgress",
  components: {},
  props: {
    rp: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const progressToNextLevel = computed<number>(() => (props.rp % 1) * 100);
    const levelNumber = computed<number>(() => Math.floor(props.rp));

    return {
      progressToNextLevel,
      levelNumber,
    };
  },
});
</script>

<style lang="scss" scoped>
.level-progress {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.75);
  border-radius: 3px;
  min-width: 100px;
  max-width: 200px;
  text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;

  :deep(.bg-level-progress-gradient) {
    background-image: linear-gradient(white 0%, rgb(var(--v-theme-primary)) 40%, rgb(var(--v-theme-primary)) 60%, white 100%);
  }

  .v-theme--nightelf &, .v-theme--undead & {
    background-color: black;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.7);
    text-shadow: -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black, 1px 1px 0 black;

    :deep(.bg-level-progress-gradient) {
      background-image: linear-gradient(black, rgb(var(--v-theme-primary)), black);
    }
  }
}
</style>
