<template>
  <div>
    <div class="text-caption text-medium-emphasis mb-2">
      Runs on the server, over the current date window
    </div>
    <v-text-field
      :model-value="minRepeat >= 2 ? String(minRepeat) : ''"
      label="Min reports per player"
      type="number"
      min="2"
      placeholder="e.g. 3"
      density="compact"
      autofocus
      hide-details
      @update:modelValue="(value: string) => $emit('update:minRepeat', value)"
    />
    <v-btn-toggle
      :model-value="mode"
      mandatory
      density="compact"
      variant="outlined"
      divided
      class="mt-2"
      @update:modelValue="(value: unknown) => $emit('update:mode', value)"
    >
      <v-btn value="submitted" size="small" title="Only reports the chronic reporter submitted personally">
        Submitted by
      </v-btn>
      <v-btn value="involved" size="small" title="Every report the chronic reporter appears in">
        Involving
      </v-btn>
    </v-btn-toggle>
    <div class="text-caption text-medium-emphasis mt-1">
      Keeps reports tied to players with at least that many submissions in the window.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

// The repeat-reporters editor: a threshold plus the mode choice between
// reports the player submitted and reports they merely appear in.
export default defineComponent({
  name: "RepeatEditor",
  props: {
    minRepeat: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
  },
  emits: ["update:minRepeat", "update:mode"],
});
</script>
