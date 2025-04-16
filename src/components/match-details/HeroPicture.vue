<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-img v-on="on" :src="heroPicture" :width="size" :aspect-ratio="1 / 1"></v-img>
    </template>
    <div>{{ heroName }}</div>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { getAsset } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";
import { useI18n } from "vue-i18n-bridge";

export default defineComponent({
  name: "HeroPicture",
  components: {},
  props: {
    heroIcon: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: false,
      default: 128
    }
  },
  setup(props) {
    const { t } = useI18n();

    const heroPicture = ref<string>(getAsset(`heroes/${props.heroIcon}.png`));
    const heroName = ref<TranslateResult>(t(`heroNames.${props.heroIcon}`));

    return {
      heroPicture,
      heroName,
    };
  },
});
</script>
