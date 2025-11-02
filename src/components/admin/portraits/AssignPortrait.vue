<template>
  <v-container @click="assignPortrait">
    <v-tooltip location="top" content-class="w3-tooltip elevation-1">
      <template v-slot:activator="{ props }">
        <v-img min-width="35" min-height="35" max-width="250" max-height="250" :src="urlById" v-bind="props" />
      </template>
      <span>ID: {{ portraitId }}</span>
    </v-tooltip>
    <v-btn v-if="isAssigned" class="cancel-button" style="background-color: transparent" icon variant="flat" size="x-large" density="compact" @click="removeAssignedPortrait">
      <v-icon size="x-large">{{ mdiCloseCircleOutline }}</v-icon>
    </v-btn>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/types";
import { mdiCloseCircleOutline } from "@mdi/js";

export default defineComponent({
  name: "AssignPortrait",
  components: {},
  props: {
    portraitId: {
      type: Number,
      required: true,
    },
    isAssigned: {
      type: Boolean,
      required: false,
      default: false,
    },
    selectable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(props, context) {
    const urlById = ref<string>(getAvatarUrl(EAvatarCategory.SPECIAL, props.portraitId, false));

    function removeAssignedPortrait(): void {
      if (props.selectable) {
        context.emit("portrait-deselected", props.portraitId);
      }
    }

    function assignPortrait(): void {
      if (!props.isAssigned && props.selectable) {
        context.emit("portrait-selected", props.portraitId);
      }
    }

    return {
      mdiCloseCircleOutline,
      urlById,
      removeAssignedPortrait,
      assignPortrait,
    };
  },
});
</script>

<style lang="scss" scoped>
.cancel-button {
  left: 27%;
}
</style>
