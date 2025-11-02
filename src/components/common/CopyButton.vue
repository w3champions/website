<template>
  <v-tooltip location="top" content-class="w3-tooltip elevation-1">
    <template v-slot:activator="{ props }">
      <v-btn size="small" v-bind="props" :aria-label="$t(`components_common_copybutton.${tooltipText}`)" @click="copy">
        <v-icon size="x-large">{{ mdiContentCopy }}</v-icon>
      </v-btn>
    </template>
    <span>{{ $t(`components_common_copybutton.${tooltipText}`) }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { mdiContentCopy } from "@mdi/js";
import { defineComponent } from "vue";

export default defineComponent({
  name: "CopyButton",
  components: {},
  props: {
    copyText: {
      type: String,
      required: true,
    },
    tooltipText: {
      type: String,
      required: false,
      default: "tooltip",
    },
  },
  setup(props) {
    function copy() {
      navigator.clipboard.writeText(props.copyText);
    }

    return {
      mdiContentCopy,
      copy,
    };
  },
});
</script>
