<template>
  <div>
    <img
      v-if="renderIcon"
      :src="renderIcon"
      :title="enumToString.toString()"
      class="race-icon"
      height="24px"
      width="auto"
      :alt="enumToString.toString()"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { i18n } from "@/main";
import { TranslateResult } from "vue-i18n";
import { getAsset } from "@/helpers/url-functions";
import { ERaceEnum } from "@/store/types";
import isNil from "lodash/isNil";

export default defineComponent({
  name: "RaceIcon",
  components: {},
  props: {
    race: {
      type: Number as PropType<ERaceEnum>,
      required: false,
      default: null,
    },
  },
  setup(props) {
    const renderIcon = ref<string>(ERaceEnum[props.race] ? getAsset(`raceIcons/${ERaceEnum[props.race]}.png`) : "");
    const enumToString = ref<TranslateResult>(isNil(props.race) ? "" : i18n.t(`races.${ERaceEnum[props.race]}`));

    return {
      renderIcon,
      enumToString,
    };
  },
});
</script>
