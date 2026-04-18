<template>
  <div>
    <v-card-title class="pt-3 d-flex align-center">
      <v-btn variant="text" :prepend-icon="mdiArrowLeft" @click="goBack">Back</v-btn>
      <span class="ml-2">Lag Report Detail</span>
    </v-card-title>

    <v-container v-if="loading" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </v-container>

    <v-container v-else-if="report" fluid class="pa-4">
      <lag-report-header :report="report" :player-colors="playerColors" />

      <lag-report-topology
        :players="report.players"
        :player-colors="playerColors"
        :server-node-name="report.serverNodeName"
      />

      <v-expansion-panels v-model="expandedPanels" multiple class="mb-4">
        <lag-report-continuous-monitoring
          :report="report"
          :player-colors="playerColors"
          :inspector-left-ms="inspectorLeftMs"
          :inspector-right-ms="inspectorRightMs"
          @update:inspector-left-ms="inspectorLeftMs = $event"
          @update:inspector-right-ms="inspectorRightMs = $event"
          @open-inspector="openInspector"
        />

        <lag-report-inspector
          :report="report"
          :player-colors="playerColors"
          :inspector-left-ms="inspectorLeftMs"
          :inspector-right-ms="inspectorRightMs"
          @update:inspector-left-ms="inspectorLeftMs = $event"
          @update:inspector-right-ms="inspectorRightMs = $event"
        />

        <lag-report-event-data :players="report.players" :player-colors="playerColors" />

        <lag-report-raw-data :players="report.players" :player-colors="playerColors" />
      </v-expansion-panels>
    </v-container>

    <v-container v-else>
      <v-alert type="warning">Report not found.</v-alert>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from "vue";
import { useLagReportsStore } from "@/store/admin/lagReports/store";
import { mdiArrowLeft } from "@mdi/js";
import { useRoute, useRouter } from "vue-router";
import { EAdminRouteName } from "@/router/types";
import LagReportHeader from "@/components/admin/lag-reports/LagReportHeader.vue";
import LagReportTopology from "@/components/admin/lag-reports/LagReportTopology.vue";
import LagReportContinuousMonitoring from "@/components/admin/lag-reports/LagReportContinuousMonitoring.vue";
import LagReportInspector from "@/components/admin/lag-reports/LagReportInspector.vue";
import LagReportEventData from "@/components/admin/lag-reports/LagReportEventData.vue";
import LagReportRawData from "@/components/admin/lag-reports/LagReportRawData.vue";

const PLAYER_COLORS = ["#ef5350", "#42a5f5", "#66bb6a", "#ffb74d", "#ab47bc", "#26c6da", "#ec407a", "#8d6e63"];

export default defineComponent({
  name: "AdminLagReportDetail",
  components: {
    LagReportHeader,
    LagReportTopology,
    LagReportContinuousMonitoring,
    LagReportInspector,
    LagReportEventData,
    LagReportRawData,
  },
  props: {
    id: { type: String, required: true },
  },
  setup(props) {
    const lagReportsStore = useLagReportsStore();
    const router = useRouter();
    const route = useRoute();

    const report = computed(() => lagReportsStore.selectedReport);
    const loading = computed(() => lagReportsStore.selectedReportLoading);

    const expandedPanels = ref(["continuous", "inspector"]);
    const inspectorLeftMs = ref<number | null>(null);
    const inspectorRightMs = ref<number | null>(null);

    const playerColors = computed(() => {
      return (report.value?.players ?? []).map((_, i) => PLAYER_COLORS[i % PLAYER_COLORS.length]);
    });

    function openInspector() {
      if (!expandedPanels.value.includes("inspector")) {
        expandedPanels.value.push("inspector");
      }
    }

    function goBack() {
      router.push({ name: EAdminRouteName.LAG_REPORTS, query: route.query });
    }

    onMounted(async () => {
      await lagReportsStore.loadReport(props.id);
    });

    return {
      report,
      loading,
      expandedPanels,
      inspectorLeftMs,
      inspectorRightMs,
      playerColors,
      openInspector,
      goBack,
      mdiArrowLeft,
    };
  },
});
</script>
