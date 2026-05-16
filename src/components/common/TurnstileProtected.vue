<template>
  <div class="turnstile-protected">
    <div v-if="loading" class="turnstile-loading">
      <v-progress-circular indeterminate size="24" />
      <span class="ml-2">{{ $t("common.verifying") || "Verifying..." }}</span>
    </div>
    <div v-else-if="isError" class="turnstile-error">
      <v-alert type="error" density="compact">
        {{ errorMessage }}
      </v-alert>
      <v-btn size="small" class="mt-2" @click="retry">
        {{ $t("common.retry") || "Retry" }}
      </v-btn>
    </div>
    <slot v-else :token="token" :getToken="getToken"></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { TurnstileService } from "@/services/TurnstileService";

const { action = undefined, autoVerify = false } = defineProps<{
  action?: string;
  autoVerify?: boolean;
}>();

const emit = defineEmits<{
  verified: [token: string];
  error: [error: Error];
}>();

const turnstileService = TurnstileService.getInstance();
const loading = ref(false);
const isError = ref(false);
const errorMessage = ref("");
const token = ref<string | null>(null);

const getToken = async (): Promise<string | null> => {
  if (!turnstileService.isEnabled()) {
    // Turnstile is disabled, return null and let the component handle it
    return null;
  }

  loading.value = true;
  isError.value = false;
  errorMessage.value = "";

  try {
    const newToken = await turnstileService.getToken(action);
    if (!newToken) {
      throw new Error("Failed to get verification token");
    }
    token.value = newToken;
    emit("verified", newToken);
    return newToken;
  } catch (err) {
    isError.value = true;
    errorMessage.value = err instanceof Error ? err.message : "Verification failed";
    emit("error", err instanceof Error ? err : new Error("Verification failed"));
    return null;
  } finally {
    loading.value = false;
  }
};

const retry = () => {
  getToken();
};

onMounted(() => {
  if (autoVerify) {
    getToken();
  }
});
</script>

<style lang="scss" scoped>
.turnstile-protected {
  position: relative;
}

.turnstile-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.turnstile-error {
  padding: 16px;
  text-align: center;
}
</style>
