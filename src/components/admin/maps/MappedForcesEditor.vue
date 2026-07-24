<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-1">
      <span class="text-medium-emphasis text-body-2">Mapped forces (JSON)</span>
      <v-btn size="small" variant="text" :disabled="!!error" @click="format">
        Format
      </v-btn>
    </div>

    <div class="json-editor" :class="{ 'json-editor--error': !!error }">
      <div ref="scrollRef" class="json-editor__scroll">
        <div class="json-editor__gutter" aria-hidden="true">
          <div
            v-for="n in lineCount"
            :key="n"
            class="json-editor__gutter-line"
            :class="{ 'json-editor__gutter-line--error': n === errorLine }"
          >
            {{ n }}
          </div>
        </div>
        <textarea
          ref="textareaRef"
          v-model="text"
          class="json-editor__input"
          :rows="lineCount"
          wrap="off"
          spellcheck="false"
          placeholder="[]"
          aria-label="Mapped forces JSON"
          :aria-invalid="!!error"
        ></textarea>
      </div>
    </div>

    <div class="d-flex align-start mt-1">
      <span class="text-caption" :class="error ? 'text-error' : 'text-medium-emphasis'">
        {{ error ?? hint }}
      </span>
      <v-btn v-if="errorLine" size="x-small" variant="text" class="ml-2" @click="goToErrorLine">
        Go to line {{ errorLine }}
      </v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from "vue";
import type { MapForce } from "@/store/admin/mapsManagement/types";
import { describeFailure, parseMappedForces, resolveFailure, summariseForces } from "./mappedForces";

export default defineComponent({
  name: "MappedForcesEditor",
  props: {
    modelValue: {
      type: Array as PropType<MapForce[]>,
      default: () => [],
    },
  },
  emits: {
    // Only ever emitted with content that parsed and validated.
    "update:modelValue": (forces: MapForce[]) => Array.isArray(forces),
    "update:valid": (valid: boolean) => typeof valid === "boolean",
  },
  setup(props, context) {
    // The text is the source of truth while editing, so that invalid intermediate states
    // survive keystrokes instead of being round-tripped through the parsed value.
    const text = ref<string>(JSON.stringify(props.modelValue ?? [], null, 2));
    const textareaRef = ref<HTMLTextAreaElement | null>(null);
    const scrollRef = ref<HTMLElement | null>(null);

    const parsed = computed(() => parseMappedForces(text.value));
    const lineCount = computed<number>(() => text.value.split("\n").length);

    const failure = computed(() => parsed.value.error ? resolveFailure(parsed.value.error, text.value) : null);
    const error = computed<string | null>(() => failure.value ? describeFailure(failure.value) : null);
    const errorLine = computed<number | null>(() => failure.value?.line ?? null);
    const hint = computed<string>(() => parsed.value.forces ? summariseForces(parsed.value.forces) : "");

    watch(parsed, (current) => {
      context.emit("update:valid", !current.error);
      if (current.forces) context.emit("update:modelValue", current.forces);
    }, { immediate: true });

    function format() {
      const forces = parsed.value.forces;
      if (!forces) return;
      text.value = JSON.stringify(forces, null, 2);
    }

    function goToErrorLine() {
      const line = errorLine.value;
      const textarea = textareaRef.value;
      if (!line || !textarea) return;

      const lines = text.value.split("\n");
      const start = lines.slice(0, line - 1).reduce((total, value) => total + value.length + 1, 0);

      textarea.focus();
      textarea.setSelectionRange(start, start + (lines[line - 1]?.length ?? 0));

      const scroll = scrollRef.value;
      if (scroll) {
        const lineHeight = textarea.scrollHeight / Math.max(lines.length, 1);
        scroll.scrollTop = Math.max(0, (line - 1) * lineHeight - scroll.clientHeight / 2);
      }
    }

    return { text, textareaRef, scrollRef, lineCount, error, errorLine, hint, format, goToErrorLine };
  },
});
</script>

<style lang="scss" scoped>
$line-height: 1.4;
$min-lines: 3;
$max-lines: 15;

.json-editor {
  border: 1px solid rgba(var(--v-border-color), var(--v-medium-emphasis-opacity));
  border-radius: 4px;
  font-size: 0.8rem;

  &:focus-within {
    border-color: rgb(var(--v-theme-primary));
  }

  &--error,
  &--error:focus-within {
    border-color: rgb(var(--v-theme-error));
  }
}

// The textarea is sized to its full content via :rows, so it never scrolls vertically on
// its own. This element scrolls instead, which keeps the gutter locked to the text
// without any scroll syncing. Horizontal overflow stays inside the textarea so the
// gutter cannot slide out of view.
//
// Only a maximum is set here: the height follows the content, so an empty force list
// stays small. The floor lives on the textarea rather than here so that the whole of a
// near-empty box is still clickable.
.json-editor__scroll {
  display: flex;
  align-items: flex-start;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: $max-lines * $line-height * 1em;
}

.json-editor__gutter,
.json-editor__input {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: inherit;
  line-height: $line-height;
  padding: 4px 0;
  margin: 0;
  border: 0;
}

.json-editor__gutter {
  flex: 0 0 auto;
  padding-right: 8px;
  padding-left: 8px;
  text-align: right;
  user-select: none;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  border-right: 1px solid rgba(var(--v-border-color), var(--v-idle-opacity));
}

.json-editor__gutter-line--error {
  color: rgb(var(--v-theme-error));
  font-weight: 700;
}

.json-editor__input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: $min-lines * $line-height * 1em;
  padding-left: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  resize: none;
  outline: none;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  white-space: pre;
}
</style>
