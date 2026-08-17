<template>
  <div>
    <v-text-field
      :model-value="input"
      label="Server name"
      placeholder="Starts with… — Enter adds a name filter"
      density="compact"
      autofocus
      hide-details
      @update:modelValue="(value: string) => $emit('update:input', value)"
      @keyup.enter="$emit('commit')"
    />
    <v-list v-if="options.length > 0" density="compact" class="mt-1">
      <v-list-item v-for="opt in options" :key="opt.key" @click="$emit('toggle', opt)">
        <template v-slot:prepend>
          <v-checkbox-btn
            :model-value="opt.selected"
            density="compact"
            @click.stop="$emit('toggle', opt)"
          />
        </template>
        <v-list-item-title>{{ opt.label }}</v-list-item-title>
        <template v-slot:append>
          <span v-if="opt.count != null" class="text-caption text-medium-emphasis">{{ opt.count }}</span>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

// One entry the server filter can hold or suggest: an exact node pick
// ("this node") or a typed name prefix ("names like this").
export type ServerOption = {
  key: string;
  label: string;
  count: number | null;
  selected: boolean;
  kind: "node" | "prefix";
  nodeId?: number;
  name: string;
};

// The multi-select server editor. The text box doubles as the way to add a
// name no suggestion offers (Enter emits commit); ticking an entry emits
// toggle. The bar owns the input value and the option list — the close-time
// commit-or-drop decision for leftover text has to outlive this component,
// which unmounts with its menu.
export default defineComponent({
  name: "ServerEditor",
  props: {
    input: {
      type: String,
      required: true,
    },
    options: {
      type: Array as PropType<ServerOption[]>,
      required: true,
    },
  },
  emits: ["update:input", "commit", "toggle"],
});
</script>
