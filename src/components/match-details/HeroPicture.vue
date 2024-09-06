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
import { defineComponent, ref } from "vue";
import { getAsset } from "@/helpers/url-functions";
import { TranslateResult } from "vue-i18n";
import { useI18n } from "vue-i18n";

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
