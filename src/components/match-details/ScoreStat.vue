<template>
  <div class="score-stat-row">
    <div class="score-stat-value text-right" :class="stat1Class">
      {{ stat1 }}
    </div>
    <div class="score-stat-icon">
      <img :src="`/assets/icons/stat-${icon}-icon.png`" width="16" height="16" :alt="icon" />
    </div>
    <div class="score-stat-title">{{ title }}</div>
    <div class="score-stat-icon">
      <img :src="`/assets/icons/stat-${icon}-icon.png`" width="16" height="16" :alt="icon" />
    </div>
    <div class="score-stat-value text-left" :class="stat2Class">
      {{ stat2 }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";

export default defineComponent({
  name: "ScoreStat",
  props: {
    stat1: {
      type: Number,
      required: true,
    },
    stat2: {
      type: Number,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const stat1Class = computed(() => {
      if (props.stat1 === props.stat2) return "";
      return props.stat1 > props.stat2 ? "w3-won" : "w3-lost";
    });

    const stat2Class = computed(() => {
      if (props.stat1 === props.stat2) return "";
      return props.stat1 < props.stat2 ? "w3-won" : "w3-lost";
    });

    return { stat1Class, stat2Class };
  },
});
</script>

<style lang="scss" scoped>
.score-stat-row {
  display: grid;
  grid-template-columns: 1fr 16px 135px 16px 1fr;
  column-gap: 10px;
  grid-template-rows: 16px;
  align-items: center;
  line-height: 1;
}

.score-stat-icon {
  display: flex;
  justify-content: center;
}

.score-stat-title {
  text-align: center;
  white-space: nowrap;
}

@media (max-width: 750px) {
  .score-stat-title {
    font-size: 0.78rem;
  }
}
</style>
