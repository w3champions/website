<template>
  <v-tooltip top>
    <template #activator="{ on, attrs }">
      <v-btn
        small
        v-bind="attrs"
        v-on="on"
        @click="copy"
        :aria-label="$t(`components_common_copybutton.${tooltipText}`)"
      >
        <v-icon>{{ mdiContentCopy }}</v-icon>
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
