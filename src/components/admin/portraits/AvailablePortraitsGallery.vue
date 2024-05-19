<template>
  <v-col>
    <v-card-title class="justify-center">Special Portraits</v-card-title>
    <v-row no-gutters :justify="'start'">
      <v-col v-for="portraitId in allSpecialPortraits" :key="portraitId" cols="1">
        <assign-portrait :portraitId="portraitId" class="pa-1" :selectable="selectable" v-on="$listeners"/>
      </v-col>
    </v-row>
  </v-col>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import AssignPortrait from "./AssignPortrait.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";

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
    const playerManagement = usePlayerManagementStore();
    const allSpecialPortraits = ref<number[]>([]);

    async function init(): Promise<void> {
      const specials = playerManagement.allSpecialPortraits;

      if (specials && specials.length > 0) {
        allSpecialPortraits.value = Object.create(specials.map((x) => parseInt(x.id)).sort((a, b) => b - a));
      } else {
        await playerManagement.loadAllSpecialPortraits();
        allSpecialPortraits.value = Object.create(
          playerManagement.allSpecialPortraits
            .map((x) => parseInt(x.id))
            .sort((a, b) => b - a)
        );
      }
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
