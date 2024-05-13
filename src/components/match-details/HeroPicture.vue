<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-card-text
        v-on="on"
        class="hero-icon"
        :style="{ 'background-image': 'url(' + heroPicture + ')' }"
      />
    </template>
    <div>{{ heroName }}</div>
  </v-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { getAsset } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";
import { i18n } from "@/main";

export default defineComponent({
  name: "HeroPicture",
  components: {},
  props: {
    heroIcon: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const heroPicture = ref<string>(getAsset(`heroes/${props.heroIcon}.png`));
    const heroName = ref<TranslateResult>(i18n.t(`heroNames.${props.heroIcon}`));

    return {
      heroPicture,
      heroName,
    };
  },
});
</script>

<style lang="scss" scoped>
.hero-icon {
  z-index: 1;
  position: relative;
  padding-top: 100%;
  padding-bottom: 0;
  width: 100%;
  margin-bottom: -2px !important;
  background-repeat: no-repeat;
  background-size: contain;
}
</style>
