<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <v-row no-gutters :justify="'start'">
      <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
        <assign-portrait :portraitId class="pa-1" :selectable v-on="$listeners" />
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import AssignPortrait from "./AssignPortrait.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { useOauthStore } from "@/store/oauth/store";

export default defineComponent({
  name: "AvailablePortraitsGallery",
  components: {
    AssignPortrait,
  },
  props: {
    selectable: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  setup() {
    const oauthStore = useOauthStore();
    const playerManagement = usePlayerManagementStore();
    const allSpecialPortraits = ref<number[]>([]);

    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;

      await playerManagement.loadAllSpecialPortraits();
      allSpecialPortraits.value = Object.create(
        playerManagement.allSpecialPortraits
          .map((x) => parseInt(x.id))
          .sort((a, b) => b - a),
      );
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      allSpecialPortraits,
    };
  },
});
</script>
