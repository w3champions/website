<template>
  <img :src="icon" class="league-icon" alt="league" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from "vue";
import { EClanRole } from "@/store/clan/types";

export default defineComponent({
  name: "ClanRoleIcon",
  components: {},
  props: {
    role: {
      type: Number as PropType<EClanRole>,
      required: true,
    },
  },
  setup(props) {
    const icon = ref<string>(`/assets/clanRoleIcon/${EClanRole[props.role]}.jpg`);

    return {
      icon,
    };
  },
});
</script>

<style lang="scss" scoped>
.league-icon {
  width: 32px;
  height: 32px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
