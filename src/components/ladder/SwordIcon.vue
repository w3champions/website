<template>
  <img :src="swordIcon" class="sword-icon" />
</template>

<script lang="ts">
import { ref, defineComponent } from "vue";
import { getAsset } from "@/helpers/url-functions";

export default defineComponent({
  name: "SwordIcon",
  components: {},
  props: {},
  setup() {
    const swordIcon = ref<string>(getAsset(`swords.svg`));

    return {
      swordIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.sword-icon {
  width: 18px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
