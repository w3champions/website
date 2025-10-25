<template>
  <div>
    <v-card-title>
      View Server Logs
    </v-card-title>
    <v-container fluid>
      <v-row>
        <v-col>
          <v-row no-gutters :justify="'start'">
            <v-col v-for="logfileName in logfileNames" :key="logfileName" cols="3" class="mb-1 logfileName" @click="viewLog(logfileName)">
              {{ logfileName }}
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, watch } from "vue";
import { useServerLogsStore } from "@/store/admin/serverLogs/store";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter } from "vue-router";

export default defineComponent({
  name: "AdminServerLogs",
  components: {},
  setup() {
    const router = useRouter();
    const oauthStore = useOauthStore();
    const serverLogsStore = useServerLogsStore();

    const logfileNames = computed<string[]>(() => serverLogsStore.logfileNames);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    function viewLog(logFileName: string): void {
      router.push({
        path: `/admin/admin-server-logs/${stripExtension(logFileName)}`
      }).catch(() => null);
    }

    // We need to strip the file extension from the filename before pushing it to the url, because vite doesn't like paths with periods in them, and returns a 404.
    // Read more here: https://stackoverflow.com/questions/71029445/handling-dot-in-vue-router-params-using-vue-3
    const stripExtension = (fileName: string): string => fileName.slice(0, -4);

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await serverLogsStore.fetchLogfileNames();
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      logfileNames,
      viewLog,
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
