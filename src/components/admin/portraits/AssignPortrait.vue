<template>
  <v-container class="ma-0 pa-0" @click="assignPortrait">
    <v-tooltip top>
      <template v-slot:activator="{ on }">
        <v-img min-width="35" min-height="35" max-width="250" max-height="250" :src="urlById" v-on="on"></v-img>
      </template>
      <span>ID: {{ portraitId }}</span>
    </v-tooltip>
    <v-btn class="cancel-button" right v-if="isAssigned" icon @click="removeAssignedPortrait">
      <v-icon large>{{ mdiCloseCircleOutline }}</v-icon>
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
