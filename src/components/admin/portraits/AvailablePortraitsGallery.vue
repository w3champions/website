<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <div class="portrait-grid">
      <assign-portrait v-for="portraitId in allSpecialPortraits" :key="portraitId" :portraitId="portraitId" :imageVersion="imageVersion" class="pa-0" :selectable="selectable" @portrait-selected="portraitSelected" />
    </div>
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

<style scoped>
.portrait-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 8px;
}
@media (max-width: 960px) {
  .portrait-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
  .portrait-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
