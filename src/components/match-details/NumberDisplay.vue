<template>
  <div>
    <v-tooltip v-if="object.length > 1" :location="align === 'left' ? 'left' : 'right'" content-class="w3-tooltip elevation-1">
      <template v-slot:activator="{ props }">
        <span v-bind="props">{{ stringValues }}</span>
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
import { ResourceScore, UnitScore } from "@/store/types";

type UnitOrResourceScore = UnitScore | ResourceScore;

export default defineComponent({
  name: "NumberDisplay",
  components: {},
  props: {
    object: {
      type: Array<UnitOrResourceScore>,
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
    function getArray(): number[] {
      return props.object
        .map((o: UnitOrResourceScore) => o[props.value as keyof UnitOrResourceScore])
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
