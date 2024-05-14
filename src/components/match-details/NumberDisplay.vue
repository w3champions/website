<template>
  <div>
    <v-tooltip
      :right="align === 'right'"
      :left="align === 'left'"
      v-if="object.length > 1 && delimiter !== AddValuesDelimiter.SLASH"
    >
      <template v-slot:activator="{ on, attrs }">
        <span v-on="on" v-bind="attrs">{{ stringValues }}</span>
      </template>
      <div>{{ addValues }}</div>
    </v-tooltip>
    <span v-else>{{ stringValues }}</span>
  </div>
</template>

<script lang="ts">
import { PropType, defineComponent, ref } from "vue";
import { AddValuesDelimiter } from "./PlayerPerformanceOnMatch.vue";
import isNil from "lodash/isNil";

export default defineComponent({
  name: "NumberDisplay",
  components: {},
  props: {
    object: {
      type: Array<Record<string, number>>,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    align: {
      type: String,
      required: false,
      default: "left",
    },
    delimiter: {
      type: String as PropType<AddValuesDelimiter>,
      required: false,
      default: undefined,
    },
  },
  setup(props) {
    function getArray() {
      return props.object
        .map((o) => o[props.value])
        .filter((v) => !isNil(v));
    }

    const stringValues = ref<string>(getArray().join(props.delimiter ?? AddValuesDelimiter.PLUS));
    const addValues = ref<string>(getArray().reduce((a, b) => a + b, 0).toString());

    return {
      stringValues,
      addValues,
      AddValuesDelimiter,
    };
  },
});
</script>
