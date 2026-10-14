<template>
  <v-container :class="{ 'portrait-clickable': selectable }" :role="selectable ? 'button' : undefined" :tabindex="selectable ? 0 : undefined" :aria-label="`Portrait ${portraitId}`" @keydown.enter.prevent="assignPortrait" @keydown.space.prevent="assignPortrait" @click="assignPortrait">
    <v-tooltip location="top" content-class="w3-tooltip elevation-1">
      <template v-slot:activator="{ props }">
        <v-img :aspect-ratio="1" width="100%" min-width="35" max-width="250" :src="urlById" v-bind="props">
          <template v-slot:error><div class="portrait-slot-placeholder">#{{ portraitId }}<br /><span>No image</span></div></template>
        </v-img>
      </template>
      <span>ID: {{ portraitId }}</span>
    </v-tooltip>
    <v-btn v-if="isAssigned" class="cancel-button" style="background-color: transparent" icon variant="flat" size="x-large" density="compact" @click="removeAssignedPortrait">
      <v-icon size="x-large">{{ mdiCloseCircleOutline }}</v-icon>
    </v-btn>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { getAvatarUrl } from "@/helpers/url-functions";
import { EAvatarCategory } from "@/store/types";
import { mdiCloseCircleOutline } from "@mdi/js";

export default defineComponent({
  name: "AssignPortrait",
  components: {},
  props: {
    imageVersion: { type: Number, default: 0 },
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
    const urlById = computed(() => {
      const url = getAvatarUrl(EAvatarCategory.SPECIAL, props.portraitId, false);
      return props.imageVersion ? url.replace(/\?v=.*$/, `?v=${props.imageVersion}`) : url;
    });

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
.portrait-clickable { cursor: pointer; }
.portrait-slot-placeholder { height: 100%; display: grid; place-content: center; text-align: center; font-size: 12px; background: rgba(var(--v-theme-on-surface), 0.06); border-radius: 4px; }
.portrait-slot-placeholder span { font-size: 10px; opacity: 0.7; }
.cancel-button {
  left: 27%;
}
</style>
