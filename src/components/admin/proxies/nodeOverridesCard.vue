<template>
  <v-container>
    <v-row>
      <v-card-title class="mx-0" v-if="isAutomaticNode">
        Auto Node Overrides
      </v-card-title>
      <v-card-title class="mx-0" v-else>Node Overrides</v-card-title>
    </v-row>

    <v-row v-if="isLoaded">
      <v-chip-group
        v-model="chipGroupIndex"
        class="ma-2"
        active-class="info--text"
        column
        multiple
      >
        <v-chip
          v-for="(proxy, index) in availableProxies"
          :key="index"
          @click="updateProxies(proxy.id)"
          :input-value="showAsChecked(index)"
          label
          small
        >
          {{ $t(`proxies.${sanitizeString(proxy.id)}`) }}
        </v-chip>
      </v-chip-group>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from "vue";
import { Proxy, ProxySettings } from "@/store/admin/types";
import { useOauthStore } from "@/store/oauth/store";
import { useAdminStore } from "@/store/admin/store";

export default defineComponent({
  name: "nodeOverridesCard",
  components: {},
  props: {
    automaticNodes: {
      type: Boolean,
      required: false,
      default: false,
    },
    passedOverrides: {
      type: Array<string>,
      required: false,
      default: [],
    }
  },
  setup(props) {
    const oauthStore = useOauthStore();
    const adminStore = useAdminStore();

    const chipGroupIndex = ref<number[]>([]);
    const isLoaded = ref<boolean>(false);
    const isProxyListChanged = ref<boolean>(false);
    const modifiedOverrides = ref<string[]>([]);

    const searchedPlayersSetProxies = computed<ProxySettings>(() => adminStore.proxiesSetForSearchedPlayer);
    const availableProxies = computed<Proxy[]>(() => adminStore.availableProxies);
    const isAutomaticNode = computed(() => props.automaticNodes ? true : false);
    const isAdmin = computed(() => oauthStore.isAdmin);

      // todo:
    // todo: 1. Figure out why the v-chip :input-value doesnt properly work on first page load. State looks fine eventually.
    // todo: 1.1. think this happens when you select the username too quickly before loading the reviewProxies component - need a break in it.
    // todo: 2. link "confirm" button on modal to PUT request
    // todo: 3. format PUT request to endpoint using setOverrides

    const isProxyListModified = computed(() => {
      if (props.passedOverrides.length !== modifiedOverrides.value.length)
        return true;

      const uniqueValues = new Set([
        ...modifiedOverrides.value,
        ...props.passedOverrides,
      ]);

      for (const v of uniqueValues) {
        const modifiedOverridesCount = modifiedOverrides.value.filter(
          (e) => e === v
        ).length;
        const passedOverridesCount = props.passedOverrides.filter(
          (e) => e === v
        ).length;
        if (modifiedOverridesCount !== passedOverridesCount) return true;
      }

      return false;
    });

    function setProxyModified(val: boolean): void {
      adminStore.SET_PROXY_MODIFIED(val);
    }

    function updateProxies(node: string): void {
      if (modifiedOverrides.value.includes(node)) {
        const index = modifiedOverrides.value.indexOf(node);
        if (index > -1) {
          modifiedOverrides.value.splice(index, 1);
          updateProxyState(modifiedOverrides.value);
        }
      } else {
        modifiedOverrides.value.push(node);
        updateProxyState(modifiedOverrides.value);
      }
    }

    function updateProxyState(newOverrides: string[]): void {
      adminStore.updateModifiedProxies({
        overrides: newOverrides,
        isAutomatic: isAutomaticNode.value,
      });
      adminStore.SET_PROXY_MODIFIED(isProxyListModified.value);
    }

    function showAsChecked(index: number): boolean {
      return chipGroupIndex.value[index] ? true : false;
    }

    function sanitizeString(string: string): string {
      let str = string;
      str = str.replace(/-/g, `_`);
      return str;
    }

    watch(isAdmin, init);

    async function initiateChipGroupIndex(): Promise<void> {
      // sets the initial index array for the V-Chip-Group component to use
      for (let i = 0; i < availableProxies.value.length; i++) {
        for (let j = 0; j < props.passedOverrides.length; j++) {
          if (props.passedOverrides[j] === availableProxies.value[i].id) {
            chipGroupIndex.value.push(i);
          }
        }
      }
    }

    async function init() {
      if (!isAdmin.value) return;

      await adminStore.loadAvailableProxies(oauthStore.token);
      modifiedOverrides.value = JSON.parse(JSON.stringify(props.passedOverrides));
      await initiateChipGroupIndex();
      updateProxyState(props.passedOverrides);
      setTimeout(setLoaded, 100);
    }

    onMounted(async (): Promise<void> => {
      await init();
    });

    function setLoaded(): void {
      isLoaded.value = true;
    }

    return {
      isAutomaticNode,
      isLoaded,
      chipGroupIndex,
      availableProxies,
      updateProxies,
      showAsChecked,
      sanitizeString,
    };
  },
});

</script>
