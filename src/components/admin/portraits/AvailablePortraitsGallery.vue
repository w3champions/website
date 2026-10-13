<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <v-row no-gutters :justify="'start'">
      <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
        <assign-portrait :portraitId="portraitId" :imageVersion="imageVersion" class="pa-1" :selectable="selectable" @portrait-selected="portraitSelected" />
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from "vue";
import AssignPortrait from "./AssignPortrait.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { useOauthStore } from "@/store/oauth/store";

export default defineComponent({
  name: "AvailablePortraitsGallery",
  components: {
    AssignPortrait,
  },
  props: {
    imageVersion: { type: Number, default: 0 },
    selectable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup(_props, context) {
    const oauthStore = useOauthStore();
    const playerManagement = usePlayerManagementStore();
    const allSpecialPortraits = computed<number[]>(() => playerManagement.allSpecialPortraits
      .map((portrait) => Number(portrait.id)).sort((a, b) => b - a));

    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;

      await playerManagement.loadAllSpecialPortraits();
    }

    function portraitSelected(portraitId: number): void {
      context.emit("portrait-selected", portraitId);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      allSpecialPortraits,
      portraitSelected,
    };
  },
});
</script>
