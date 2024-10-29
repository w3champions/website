<template>
  <v-container>
    <v-row>
      <v-card-title class="ma-0 pa-0">
        Proxy settings for: {{ searchedPlayerTag }}
      </v-card-title>
    </v-row>

    <v-row>
      <v-subheader class="ma-0 pa-0">
        Do not modify the automated nodes unless you know what you're doing.
      </v-subheader>
    </v-row>

    <v-row>nodeOverrides: {{ initProxySettings.nodeOverrides }}</v-row>

    <v-row>
      automaticNodeOverrides: {{ initProxySettings.automaticNodeOverrides }}
    </v-row>

    <v-row>
      <!-- nodeOverrides -->
      <v-col class="px-0">
        <v-card class="px-1 m-1">
          <node-overrides-card
            :passedOverrides="initProxySettings.nodeOverrides"
          ></node-overrides-card>
        </v-card>
      </v-col>

      <!-- automaticNodeOverrides -->
      <v-col class="px-0">
        <v-card class="px-1 m-0">
          <node-overrides-card
            :passedOverrides="initProxySettings.automaticNodeOverrides"
            :automaticNodes="true"
          ></node-overrides-card>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="isProxyModified">
      <v-spacer></v-spacer>
      <v-dialog v-model="dialog" width="600">
        <template v-slot:activator="{ on }">
          <v-btn color="primary" v-on="on">Update Proxies</v-btn>
        </template>

        <v-card>
          <v-container>
            <!-- title + subtitle -->
            <v-row class="my-0 py-0">
              <v-card-title class="my-0 py=0">Update Proxies</v-card-title>
            </v-row>
            <v-row class="my-0 py-0">
              <v-card-subtitle class="my-0 py=0">
                Set the following proxies for this player:
              </v-card-subtitle>
            </v-row>

            <!-- Show selected nodes container -->
            <v-container class="mb-4">
              <v-row v-if="newNodeOverrides(false).length > 0">
                <v-spacer></v-spacer>
                <v-card-subtitle class="font-weight-bold">
                  Node Overrides:
                </v-card-subtitle>
                <v-spacer></v-spacer>

                <template>
                  <v-container class="py-0 my-0 justify-center" v-for="node in newNodeOverrides(false)" :key="node">
                    <v-card-text class="py-0 my-0">
                      {{ $t(`proxies.${sanitizeString(node)}`) }}
                    </v-card-text>
                  </v-container>
                </template>
              </v-row>

              <v-row v-if="newNodeOverrides(true).length > 0">
                <v-spacer></v-spacer>
                <v-card-subtitle class="font-weight-bold">
                  Auto Node Overrides:
                </v-card-subtitle>
                <v-spacer></v-spacer>

                <template>
                  <v-container class="py-0 my-0 justify-center" v-for="node in newNodeOverrides(true)" :key="node">
                    <v-card-text class="py-0 my-0">
                      {{ $t(`proxies.${sanitizeString(node)}`) }}
                    </v-card-text>
                  </v-container>
                </template>
              </v-row>
            </v-container>

            <!-- Confirm/deny row -->
            <v-row>
              <v-col class="d-flex justify-center">
                <v-btn
                  color="primary"
                  @click="(dialog = false), putNewProxies()"
                >
                  Confirm
                </v-btn>
              </v-col>

              <v-col class="d-flex justify-center">
                <v-btn color="error" @click="dialog = false">Cancel</v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-dialog>
      <v-spacer></v-spacer>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import nodeOverridesCard from "@/components/admin/proxies/nodeOverridesCard.vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useAdminStore } from "@/store/admin/store";

export default defineComponent({
  name: "reviewProxies",
  components: {
    nodeOverridesCard
  },
  props: {
    proxies: {
      type: Object as PropType<Proxy[]>,
      required: true,
    },
  },
  setup(props) {
    //! There's a visual bug with this component + nodeOverridesCard component, if anyone would like to figure it out
    //! When the component is created, sometimes the :input-value for the v-chip in nodeOverridesCard.vue is not set fast enough.
    //! this only seems to happen for Nodes (not autonodes) and is purely visual, the state and submission works fine.

    // Kovax comment:
    // props.proxies is not ProxySettings. It is an Proxy[]. But the prop is not used anyway, because it is only referenced in the
    // availableProxies getter, and it is not used.

    const adminStore = useAdminStore();
    const searchedPlayerTag = ref<string>("");
    const initProxySettings = ref<ProxySettings>({ nodeOverrides: [], automaticNodeOverrides: [] });
    const originalProxySettings = ref<ProxySettings>({ nodeOverrides: [], automaticNodeOverrides: [] });
    const dialog = ref<boolean>(false);

    const availableProxies = computed<Proxy[]>(() => props.proxies);
    const modifiedProxies = computed<ProxySettings>(() => adminStore.modifiedProxies);
    const isProxyModified = computed<boolean>(() => adminStore.proxyModified);

    function putNewProxies(): void {
      if (isProxyModified.value) {
        adminStore.putNewProxies(adminStore.modifiedProxies);
      }
    }

    function sanitizeString(string: string): string {
      let str = string;
      str = str.replace(/-/g, `_`);
      return str;
    }

    function newNodeOverrides(auto: boolean): string[] {
      return auto ? adminStore.modifiedProxies.automaticNodeOverrides : adminStore.modifiedProxies.nodeOverrides;
    }

    function checkOverridesAreSame(initOverrides: string[], modifiedOverrides: string[]): boolean {
      const uniqueValues = new Set([...initOverrides, ...modifiedOverrides]);

      for (const v of uniqueValues) {
        const initOverridesCount = initOverrides.filter((e) => e === v).length;
        const modifiedOverridesCount = modifiedOverrides.filter((e) => e === v).length;
        if (initOverridesCount !== modifiedOverridesCount) return false;
      }

      return true;
    }

    async function init(): Promise<void> {
      searchedPlayerTag.value = adminStore.searchedBattletag;
      initProxySettings.value = await adminStore.getProxiesForPlayer(searchedPlayerTag.value);
      adminStore.updateModifiedProxies({ overrides: initProxySettings.value.nodeOverrides, isAutomatic: false });
      adminStore.updateModifiedProxies({ overrides: initProxySettings.value.automaticNodeOverrides, isAutomatic: true });
      originalProxySettings.value = JSON.parse(JSON.stringify(initProxySettings.value));
      adminStore.SET_PROXY_MODIFIED(false);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    return {
      searchedPlayerTag,
      initProxySettings,
      isProxyModified,
      newNodeOverrides,
      sanitizeString,
      dialog,
      putNewProxies,
    };
  },
});
</script>
