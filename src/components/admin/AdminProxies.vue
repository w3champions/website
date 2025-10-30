<template>
  <div>
    <v-card-title>
      Proxy Settings
    </v-card-title>
    <v-container class="w3-container-width">
      <v-row class="d-flex justify-center">
        <v-col cols="12" md="8">
          <player-search
            classes="ml-5 mr-5"
            @searchCleared="searchCleared"
            @playerFound="playerFound"
          />
        </v-col>
      </v-row>

      <review-proxies
        v-if="showProxyOptions"
        :proxies="availableProxies"
      />
    </v-container>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import ReviewProxies from "@/components/admin/proxies/ReviewProxies.vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import PlayerSearch from "@/components/common/PlayerSearch.vue";
import { useAdminStore } from "@/store/admin/store";

export default defineComponent({
  name: "AdminProxies",
  components: {
    ReviewProxies,
    PlayerSearch,
  },
  setup() {
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();
    const showProxyOptions = ref<boolean>(false);
    const availableProxies = computed<Proxy[]>(() => adminStore.availableProxies);
    const isAdmin = computed<boolean>(() => oauthStore.isAdmin);

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
