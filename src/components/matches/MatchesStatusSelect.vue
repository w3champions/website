<template>
  <v-btn
    tile
    class="w3-dropdown-button"
    style="background-color: transparent"
    @click="toggleStatus"
  >
    <v-icon size="x-large" start>{{ mdiControllerClassic }}</v-icon>
    {{ currentStatus.name }}
  </v-btn>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { MatchStatus } from "@/store/match/types";
import { useMatchStore } from "@/store/match/store";
import { mdiControllerClassic } from "@mdi/js";
import { useI18n } from "vue-i18n";

interface MatchStatusSelectData {
  name: string;
  status: MatchStatus;
}

export default defineComponent({
  name: "MatchesStatusSelect",
  components: {},
  setup() {
    const { t } = useI18n();
    const matchStore = useMatchStore();

    const matchStatuses: MatchStatusSelectData[] = [
      {
        name: t("matchStatuses.onGoing"),
        status: MatchStatus.onGoing,
      },
      {
        name: t("matchStatuses.past"),
        status: MatchStatus.past,
      },
    ];

    const currentStatus = computed<MatchStatusSelectData>(
      () => matchStatuses.find((x) => x.status == matchStore.status)!,
    );

    const toggleStatus = (): void => {
      const next = currentStatus.value.status === MatchStatus.onGoing
        ? MatchStatus.past
        : MatchStatus.onGoing;
      matchStore.setStatus(next);
    };

    return {
      mdiControllerClassic,
      currentStatus,
      toggleStatus,
    };
  },
});
</script>
