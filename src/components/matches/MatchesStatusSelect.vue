<template>
  <v-btn
    tile
    class="w3-dropdown-button matches-status-select"
    style="background-color: transparent"
    :aria-label="currentStatus.name"
    @click="toggleStatus"
  >
    <span class="matches-status-select__state-icon">
      <span v-if="isOngoing" class="matches-status-select__live-dot" aria-hidden="true"></span>
      <v-icon v-else size="x-large">{{ mdiHistory }}</v-icon>
    </span>
    {{ currentStatus.name }}
  </v-btn>
</template>

<script lang="ts">
import { computed, defineComponent } from "vue";
import { MatchStatus } from "@/store/match/types";
import { useMatchStore } from "@/store/match/store";
import { mdiHistory } from "@mdi/js";
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
      () => matchStatuses.find((status) => status.status === matchStore.status)!,
    );
    const isOngoing = computed<boolean>(() => matchStore.status === MatchStatus.onGoing);

    function toggleStatus(): void {
      const nextStatus = isOngoing.value ? MatchStatus.past : MatchStatus.onGoing;
      matchStore.setStatus(nextStatus);
    }

    return {
      mdiHistory,
      currentStatus,
      isOngoing,
      toggleStatus,
    };
  },
});
</script>

<style lang="scss" scoped>
.matches-status-select {
  min-height: 36px;
}

.matches-status-select__state-icon,
.matches-status-select__state-icon {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 24px;
}

.matches-status-select__state-icon {
  margin-inline-end: 8px;
}

.matches-status-select__live-dot {
  background-color: rgb(var(--v-theme-success));
  border-radius: 50%;
  box-shadow:
    0 0 0 3px rgba(var(--v-theme-success), 0.18),
    0 0 10px rgba(var(--v-theme-success), 0.6);
  display: inline-block;
  height: 10px;
  width: 10px;
}

</style>
