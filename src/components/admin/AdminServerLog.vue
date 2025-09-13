<template>
  <div>
    <v-card-title>
      Server Log
    </v-card-title>
    <v-container fluid>
      <v-row>
        <v-col class="pt-0">
          <v-btn color="primary" class="w3-race-bg--text mr-3" @click="goBack">
            Go Back
          </v-btn>
          <v-btn color="primary" class="w3-race-bg--text" @click="downloadLog">
            Download
          </v-btn>
        </v-col>
      </v-row>
      <p class="font-weight-bold mt-3">{{ logFileName + ".log" }}</p>
      <v-row>
        <v-col>
          <div v-for="(line, index) in logContent" :key="index" class="mb-1">{{ line }}</div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { useServerLogsStore } from "@/store/admin/serverLogs/store";
import { useOauthStore } from "@/store/oauth/store";
import { useRouter } from "vue-router/composables";

export default defineComponent({
  name: "AdminServerLog",
  components: {},
  props: {
    logFileName: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const router = useRouter();
    const oauthStore = useOauthStore();
    const serverLogsStore = useServerLogsStore();
    const logContent = ref<string[]>([]);

    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

    function downloadLog(): void {
      serverLogsStore.downloadLog(`${props.logFileName}.log`);
    }

    function goBack(): void {
      router.push({
        path: "/admin/admin-server-logs"
      }).catch(() => null);
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      logContent.value = await serverLogsStore.fetchLogContent(`${props.logFileName}.log`);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      logContent,
      downloadLog,
      goBack,
    };
  },
});
</script>

<style lang="scss" scoped>
</style>
