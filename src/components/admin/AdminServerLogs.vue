<template>
  <div>
    <v-card-title>
      View Server Logs
    </v-card-title>
    <v-container v-if="logContent.length === 0" fluid>
      <v-row>
        <v-col>
            <v-row no-gutters :justify="'start'">
              <v-col v-for="logfileName in logfileNames" :key="logfileName" cols="3" class="mb-1 logfileName" @click="fetchLogContent(logfileName)">
                {{ logfileName }}
              </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-else fluid>
      <v-row>
        <v-col>
          <v-btn color="primary" class="w3-race-bg--text mr-3" @click="logContent = []">
            Go Back
          </v-btn>
          <v-btn color="primary" class="w3-race-bg--text" @click="downloadLog(selectedLog)">
            Download
          </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <span class="font-weight-bold">{{ selectedLog }}</span>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <div v-for="(line, index) in logContent" :key="index" class="mb-1">{{ line }}</div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref, watch, WritableComputedRef } from "vue";
import { useServerLogsStore } from "@/store/admin/serverLogs/store";
import { useOauthStore } from "@/store/oauth/store";

export default defineComponent({
  name: "AdminServerLogs",
  components: {},
  props: {},
  setup() {
    const oauthStore = useOauthStore();
    const serverLogsStore = useServerLogsStore();
    const selectedLog = ref<string>("");

    const logfileNames: ComputedRef<string[]> = computed((): string[] => serverLogsStore.logfileNames);
    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);

    const logContent: WritableComputedRef<string[]> = computed({
      get(): string[] {
        return serverLogsStore.logContent;
      },
      set(content: string[]): void {
        serverLogsStore.logContent = content;
      },
    });

    async function fetchLogContent(logfileName: string): Promise<void> {
      selectedLog.value = logfileName;
      window.scrollTo(0,0);
      await serverLogsStore.fetchLogContent(logfileName);
    }

    function downloadLog(logfileName: string): void {
      serverLogsStore.downloadLog(logfileName);
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await serverLogsStore.fetchLogfileNames();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      logContent,
      logfileNames,
      fetchLogContent,
      downloadLog,
      selectedLog,
    };
  },
});
</script>

<style lang="scss" scoped>
.logfileName {
  cursor: pointer;
  &:hover {
    background-color: lightblue;
  }
}
</style>
