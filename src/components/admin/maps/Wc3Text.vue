<template>
  <!-- Rendered as spans rather than v-html: this text comes from map files, which
       are not ours to trust. -->
  <span class="wc3-text">
    <span
      v-for="(segment, index) in segments"
      :key="index"
      :style="segment.color ? { color: segment.color } : undefined"
    >{{ segment.text }}</span>
  </span>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { parseWc3Text, Wc3TextSegment } from "./wc3Text";

export default defineComponent({
  name: "Wc3Text",
  props: {
    text: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const segments = computed<Wc3TextSegment[]>(() => parseWc3Text(props.text));
    return { segments };
  },
});
</script>

<style lang="scss" scoped>
// |n line breaks survive as newlines in the parsed text.
.wc3-text {
  white-space: pre-wrap;
}
</style>
