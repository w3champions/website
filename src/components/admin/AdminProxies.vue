<template>
  <div>
    <v-card-title>
      Proxy Settings
    </v-card-title>
    <v-container>
      <v-row>
        <player-search
          @searchCleared="searchCleared"
          @playerFound="playerFound"
          classes="ml-5 mr-5"
        ></player-search>
      </v-row>

      <review-proxies
        v-if="showProxyOptions"
        :proxies="availableProxies"
      ></review-proxies>
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, ComputedRef, defineComponent, onMounted, ref, watch } from "vue";
import reviewProxies from "@/components/admin/proxies/reviewProxies.vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";

export default defineComponent({
  name: "AdminProxies",
  components: {
    reviewProxies,
    PlayerSearch,
  },
  props: {},
  setup() {
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();
    const showProxyOptions = ref<boolean>(false);
    const availableProxies: ComputedRef<Proxy[]> = computed((): Proxy[] => adminStore.availableProxies);
    const isAdmin: ComputedRef<boolean> = computed((): boolean => oauthStore.isAdmin);

    async function playerFound(bTag: string): Promise<void> {
      const proxies = await adminStore.getProxiesForPlayer(bTag);
        await setPlayerProxies(proxies);

        if (proxies._id) {
          showProxyOptions.value = true;
        }
    }

    function searchCleared() {
      showProxyOptions.value = false;
    }

    async function setPlayerProxies(proxies: ProxySettings): Promise<void> {
      adminStore.updateModifiedProxies({ overrides: proxies.nodeOverrides, isAutomatic: false });
      adminStore.updateModifiedProxies({ overrides: proxies.automaticNodeOverrides, isAutomatic: true });
    }

    watch(isAdmin, init);

    async function init(): Promise<void> {
      if (!isAdmin.value) return;
      await adminStore.loadAvailableProxies(oauthStore.token);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      searchCleared,
      playerFound,
      showProxyOptions,
      availableProxies,
    };
  },
});
</script>
