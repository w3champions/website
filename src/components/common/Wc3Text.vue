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
import { useTheme } from "vuetify";
import { parseWc3Text, Wc3TextSegment } from "./wc3Text";
import { ensureContrast, resolveBackgroundHex } from "@/helpers/colorContrast";

export default defineComponent({
  name: "Wc3Text",
  props: {
    text: {
      type: String,
      default: "",
    },
    /**
     * Minimum contrast ratio to hold the author's colours to. The default is WCAG AA
     * for body text; pass 3 for large display text, where AA is more forgiving.
     */
    minContrast: {
      type: Number,
      default: 4.5,
    },
  },
  setup(props) {
    const theme = useTheme();

    // Map authors pick colours against the game's own dark UI, and two of the four
    // site themes are light, so a colour can arrive unreadable. Hue and saturation are
    // the author's meaning and are kept; only lightness moves, and only as far as
    // legibility needs. See helpers/colorContrast.ts.
    const background = computed<string>(() =>
      resolveBackgroundHex(
        theme.current.value.colors["w3-race-bg"],
        theme.current.value.dark,
      )
    );

    const segments = computed<Wc3TextSegment[]>(() =>
      parseWc3Text(props.text).map((segment) =>
        segment.color
          ? { ...segment, color: ensureContrast(segment.color, background.value, props.minContrast) }
          : segment
      )
    );

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
