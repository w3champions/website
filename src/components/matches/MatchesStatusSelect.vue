<template>
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-btn tile v-bind="props" class="bg-transparent">
        <v-icon style="margin-right: 5px">{{ mdiControllerClassic }}</v-icon>
        {{ currentStatus.name }}
      </v-btn>
    </template>
    <v-card>
      <v-card-text>
        <v-list>
          <v-list-item-title>
            {{ $t("components_matches_matchesstatusselect.selectstatus") }}
          </v-list-item-title>
        </v-list>
        <v-divider></v-divider>
        <v-list density="compact">
          <v-list-item
            v-for="s in matchStatuses"
            :key="s.status"
            @click="currentStatus = s"
          >
            <v-list-item-title>{{ s.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, WritableComputedRef } from "vue";
import { MatchStatus } from "@/store/match/types";
import { useMatchStore } from "@/store/match/store";
import { mdiControllerClassic } from "@mdi/js";
import { useI18n } from "vue-i18n";
import { TranslateResult } from "vue-i18n";

interface MatchStatusSelectData {
  name: TranslateResult;
  status: MatchStatus;
}

export default defineComponent({
  name: "MatchesStatusSelect",
  components: {},
  setup() {
    const { t } = useI18n();
    const matchStore = useMatchStore();

    const currentStatus: WritableComputedRef<MatchStatusSelectData> = computed({
      get(): MatchStatusSelectData {
        const selectedStatus = matchStore.status;
        return matchStatuses.find((x) => x.status == selectedStatus)!;
      },
      set(val: MatchStatusSelectData): void {
        matchStore.setStatus(val.status);
      },
    });

    const matchStatuses: MatchStatusSelectData[] = [
      {
        name: t(`matchStatuses.onGoing`),
        status: MatchStatus.onGoing,
      },
      {
        name: t(`matchStatuses.past`),
        status: MatchStatus.past,
      },
    ];

    return {
      mdiControllerClassic,
      currentStatus,
      matchStatuses,
    };
  },
});
</script>
