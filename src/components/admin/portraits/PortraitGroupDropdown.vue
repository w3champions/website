<template>
  <v-container>
    <v-menu bottom>
      <template v-slot:activator="{ props }">
        <v-btn color="primary w3-race-bg--text" dark v-bind="props">
          Select Portrait Groups
          <v-icon>{{ mdiChevronDown }}</v-icon>
        </v-btn>
      </template>

      <v-list max-height="400" class="overflow-y-auto">
        <v-list-item v-for="group in groupNames" :key="group">
          <v-tooltip left max-width="500" min-width="500">
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props" @click="addPortraitGroup(group)">
                {{ group }}
              </v-list-item>
            </template>
            <v-row no-gutters justify="start">
              <v-col v-for="portraitId in hoveredGroupPortraits(group)" :key="portraitId" cols="1" md="1">
                <assign-portrait
                  :portraitId="portraitId"
                  :isAssigned="false"
                  :isInert="true"
                  class="pa-1"
                />
              </v-col>
            </v-row>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-container>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from "vue";
import { PortraitDefinitionGroup } from "@/store/admin/types";
import AssignPortrait from "./AssignPortrait.vue";
import { usePlayerManagementStore } from "@/store/admin/playerManagement/store";
import { mdiChevronDown } from "@mdi/js";

export default defineComponent({
  name: "PortraitGroupDropdown",
  components: {
    AssignPortrait,
  },
  setup(_props, context) {
    const playerManagement = usePlayerManagementStore();
    const portraitDefGroups = ref<PortraitDefinitionGroup[]>([]);
    const groupNames = ref<string[]>([]);

    function addPortraitGroup(group: string): void {
      const portraitsToAdd = portraitDefGroups.value.find((x) => x.group == group)?.portraitIds;
      if (portraitsToAdd) {
        context.emit("add-group-of-portraits", portraitsToAdd);
      }
    }

    function hoveredGroupPortraits(defGroup: string): number[] {
      return portraitDefGroups.value.find((x) => x.group == defGroup)?.portraitIds || [];
    }

    async function init(): Promise<void> {
      await playerManagement.loadPortraitDefinitionGroups();
      portraitDefGroups.value = playerManagement.portraitDefinitionGroups;
      groupNames.value = portraitDefGroups.value
        .filter((x) => x.group) // no scuffed group names like "" or null
        .map((x) => x.group);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      mdiChevronDown,
      groupNames,
      addPortraitGroup,
      hoveredGroupPortraits,
    };
  },
});

</script>

<style lang="scss">
$tooltip-opacity: 1;
</style>
